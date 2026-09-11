/**
 * Meta (Facebook/Instagram) Lead Ads webhook
 *
 * The #1 autopilot lead source. When someone submits an Instant Form on a
 * Facebook/IG lead ad, Meta fires a `leadgen` event here in real time.
 * We fetch the full lead via the Graph API and push it through the same
 * intake pipeline as the website forms — scored, routed, alerted, enrolled.
 *
 * Setup (see docs/GO-LIVE.md):
 * 1. Meta App → Webhooks → subscribe to `leadgen` on the Page
 * 2. Callback URL: https://<site>/api/webhooks/meta
 * 3. Env vars: META_VERIFY_TOKEN, META_APP_SECRET, META_PAGE_ACCESS_TOKEN
 *
 * Compliance: run lead ads under Meta's Special Ad Category → Housing.
 * The Instant Form must include the SMS-consent checkbox if consentSms
 * is to be honored — we only set consent flags from explicit form fields.
 *
 * Failure policy: Meta treats a 200 as delivered and never resends, so a lead
 * that fails here is gone. Transient Graph errors are therefore retried
 * in-request, and anything still failing is texted to Adreanne with the
 * leadgen id and where to download it by hand, rather than being logged to a
 * console nobody reads. We keep returning 200 either way — a non-200 makes
 * Meta redeliver the whole batch (re-texting leads that already succeeded) and
 * eventually disables the subscription outright.
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntakeLeadSchema, processIntakeLead } from '@/lib/intake/process-lead';
import {
  buildLostLeadAlert,
  classifyMetaFailure,
  fetchMetaLead,
  mapMetaLead,
  toFieldMap,
  verifyMetaSignature,
  type LostLead,
} from '@/lib/intake/meta-webhook';
import { alertOwner } from '@/lib/sms/twilio';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ── GET: subscription verification handshake ──────────────────────────────────
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ── POST: leadgen events ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = verifyMetaSignature(rawBody, req.headers.get('x-hub-signature-256'));
  if (!signature.ok) {
    console.error(`[MetaWebhook] Rejected request: ${signature.reason}`);
    // Rejecting because the secret is missing is a misconfiguration, not an
    // attack: every real lead is being turned away. Say so, once per instance,
    // so a deploy that forgot the env var can't quietly stop the ads working.
    if (signature.reason.includes('META_APP_SECRET')) await alertMisconfigured(signature.reason);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: { leadgen_id?: string; form_id?: string; page_id?: string; ad_id?: string };
      }>;
    }>;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true, skipped: 'not a page event' });
  }

  const leadgenIds: Array<{ leadgenId: string; adId?: string }> = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        leadgenIds.push({ leadgenId: change.value.leadgen_id, adId: change.value.ad_id });
      }
    }
  }

  const settled = await Promise.allSettled(
    leadgenIds.map(({ leadgenId, adId }) => ingestMetaLead(leadgenId, adId))
  );

  const lost: LostLead[] = [];
  settled.forEach((result, i) => {
    if (result.status !== 'rejected') return;
    const { leadgenId, adId } = leadgenIds[i];
    const reason = result.reason as unknown;
    const failure = classifyMetaFailure(unwrapIngestError(reason));

    console.error(`[MetaWebhook] Lead ${leadgenId} lost (${failure.kind}): ${failure.detail}`, reason);
    lost.push({ leadgenId, adId, failure, fieldNames: fieldNamesOf(reason) });
  });

  // A paid lead that silently vanishes is the most expensive failure in this
  // codebase: the click was bought, the person is waiting, and nothing happens.
  if (lost.length > 0) {
    await alertOwner(buildLostLeadAlert(lost)).catch((err) =>
      console.error('[MetaWebhook] Could not alert about lost leads:', err)
    );
  }

  // Meta requires a fast 200 or it retries/disables the subscription
  return NextResponse.json({
    ok: true,
    received: leadgenIds.length,
    processed: leadgenIds.length - lost.length,
    failed: lost.length,
  });
}

/**
 * Meta redelivers a rejected event repeatedly, so this alert has to be
 * rate-limited or a misconfigured deploy would text Adreanne on every retry.
 * One per warm instance is enough to be noticed without becoming noise.
 */
let misconfigAlertedAt = 0;
const MISCONFIG_ALERT_INTERVAL_MS = 60 * 60 * 1000;

async function alertMisconfigured(reason: string): Promise<void> {
  const now = Date.now();
  if (now - misconfigAlertedAt < MISCONFIG_ALERT_INTERVAL_MS) return;
  misconfigAlertedAt = now;

  await alertOwner(
    `⚠️ ATR Meta Lead Ads — leads are being REJECTED\n\n` +
    `${reason}.\n\n` +
    `Set META_APP_SECRET in Vercel (Meta app → Settings → Basic → App Secret) ` +
    `and redeploy. Until then no Facebook or Instagram lead can come through, ` +
    `and the ads are still spending.`
  ).catch((err) => console.error('[MetaWebhook] Could not alert about misconfiguration:', err));
}

// ── Lead retrieval + mapping ──────────────────────────────────────────────────

/**
 * Carries the Instant Form's field names alongside the underlying error, so an
 * alert about an unmappable lead can show what Meta actually sent — that is the
 * difference between "a lead failed" and "your form calls it `mobile_number`".
 */
class IngestError extends Error {
  constructor(
    readonly cause: unknown,
    readonly fieldNames?: string[]
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'IngestError';
  }
}

function unwrapIngestError(err: unknown): unknown {
  return err instanceof IngestError ? err.cause : err;
}

function fieldNamesOf(err: unknown): string[] | undefined {
  return err instanceof IngestError ? err.fieldNames : undefined;
}

async function ingestMetaLead(leadgenId: string, adId?: string): Promise<void> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const lead = await fetchMetaLead(leadgenId, { token });
  const fieldNames = [...toFieldMap(lead).keys()];

  try {
    const data = IntakeLeadSchema.parse(mapMetaLead(lead, adId));
    const result = await processIntakeLead(data);
    console.log(
      `[MetaWebhook] Lead ${leadgenId} → contact ${result.contactId} ` +
      `(${result.route}, score ${result.totalScore})`
    );
  } catch (err) {
    throw new IngestError(err, fieldNames);
  }
}
