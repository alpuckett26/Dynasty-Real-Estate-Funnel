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
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { IntakeLeadSchema, processIntakeLead } from '@/lib/intake/process-lead';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GRAPH_API = 'https://graph.facebook.com/v21.0';

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

  if (!verifyMetaSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
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

  const results = await Promise.allSettled(
    leadgenIds.map(({ leadgenId, adId }) => ingestMetaLead(leadgenId, adId))
  );

  const processed = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - processed;
  if (failed > 0) {
    results.forEach((r) => {
      if (r.status === 'rejected') console.error('[MetaWebhook] Lead ingest failed:', r.reason);
    });
  }

  // Meta requires a fast 200 or it retries/disables the subscription
  return NextResponse.json({ ok: true, received: leadgenIds.length, processed, failed });
}

function verifyMetaSignature(body: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // dev mode — skip verification
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const received = header.slice('sha256='.length);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

// ── Lead retrieval + mapping ──────────────────────────────────────────────────

interface MetaLeadResponse {
  id: string;
  created_time?: string;
  field_data?: Array<{ name: string; values: string[] }>;
  campaign_name?: string;
  ad_name?: string;
}

async function ingestMetaLead(leadgenId: string, adId?: string): Promise<void> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN not configured');

  const res = await fetch(
    `${GRAPH_API}/${leadgenId}?fields=id,created_time,field_data,campaign_name,ad_name&access_token=${encodeURIComponent(token)}`
  );
  if (!res.ok) {
    throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  }
  const lead = (await res.json()) as MetaLeadResponse;

  const fields = new Map<string, string>();
  for (const f of lead.field_data ?? []) {
    if (f.values?.[0]) fields.set(f.name.toLowerCase().trim(), f.values[0]);
  }

  const { firstName, lastName } = extractName(fields);

  const raw = {
    firstName,
    lastName,
    email: fields.get('email') ?? '',
    phone: normalizeMetaPhone(fields.get('phone_number') ?? fields.get('phone') ?? ''),
    contactPreference: 'call' as const,
    intent: extractIntent(fields),
    firstTimeHomebuyer: matchesYes(fields, ['first_time_homebuyer', 'first-time buyer', 'first_time_buyer']),
    healthcareWorker: matchesYes(fields, ['healthcare_worker', 'healthcare worker']),
    areasOfInterest: fields.get('area') ?? fields.get('city') ?? fields.get('areas_of_interest') ?? fields.get('what_area_are_you_interested_in') ?? undefined,
    timeline: extractTimeline(fields),
    financingStatus: extractFinancing(fields),
    // Consent: submitting the form = email follow-up consent (form disclaimer covers it).
    // SMS consent ONLY from an explicit checkbox field on the Instant Form.
    consentEmail: true,
    consentSms: matchesYes(fields, ['sms_consent', 'text_consent', 'can_we_text_you', 'i_agree_to_receive_texts']),
    source: 'meta-lead-ad',
    utmSource: 'facebook',
    utmMedium: 'paid-social',
    utmCampaign: lead.campaign_name ?? lead.ad_name ?? adId ?? 'meta-leadgen',
  };

  const data = IntakeLeadSchema.parse(raw);
  const result = await processIntakeLead(data);
  console.log(`[MetaWebhook] Lead ${leadgenId} → contact ${result.contactId} (${result.route}, score ${result.totalScore})`);
}

function extractName(fields: Map<string, string>): { firstName: string; lastName: string } {
  const first = fields.get('first_name');
  const last = fields.get('last_name');
  if (first) return { firstName: first, lastName: last || '—' };

  const full = fields.get('full_name') ?? fields.get('name') ?? '';
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] || 'Unknown',
    lastName: parts.slice(1).join(' ') || '—',
  };
}

function extractIntent(fields: Map<string, string>): 'buyer' | 'seller' | 'both' | 'unknown' {
  const v = (
    fields.get('intent') ??
    fields.get('are_you_buying_or_selling') ??
    fields.get('buying_or_selling') ??
    ''
  ).toLowerCase();
  const buying = v.includes('buy');
  const selling = v.includes('sell');
  if (buying && selling) return 'both';
  if (buying) return 'buyer';
  if (selling) return 'seller';
  return 'unknown';
}

function extractTimeline(fields: Map<string, string>): 'now' | '30-60d' | '3-6m' | '6m+' | 'researching' {
  const v = (
    fields.get('timeline') ??
    fields.get('when_are_you_looking_to_move') ??
    fields.get('when_do_you_want_to_buy') ??
    ''
  ).toLowerCase();
  if (/asap|now|immediately|this month/.test(v)) return 'now';
  if (/1.?2 month|30|60|couple month/.test(v)) return '30-60d';
  if (/3.?6 month|this year|few month/.test(v)) return '3-6m';
  if (/6|next year|12/.test(v)) return '6m+';
  return 'researching';
}

function extractFinancing(fields: Map<string, string>): 'pre-approved' | 'need-lender' | 'need-dpa' | 'need-credit-repair' | 'unsure' {
  const v = (
    fields.get('financing') ??
    fields.get('are_you_pre-approved') ??
    fields.get('are_you_pre_approved') ??
    fields.get('financing_status') ??
    ''
  ).toLowerCase();
  if (/pre.?approved|cash/.test(v)) return 'pre-approved';
  if (/credit/.test(v)) return 'need-credit-repair';
  if (/down payment|dpa|assistance/.test(v)) return 'need-dpa';
  if (/lender|no|not yet/.test(v)) return 'need-lender';
  return 'unsure';
}

function matchesYes(fields: Map<string, string>, keys: string[]): boolean {
  for (const key of keys) {
    const v = fields.get(key)?.toLowerCase();
    if (v && /yes|true|1|checked|agree/.test(v)) return true;
  }
  return false;
}

function normalizeMetaPhone(phone: string): string {
  // Meta sends E.164 like "+12255551234" — keep it; intake accepts any 7+ char string
  return phone.replace(/[^\d+]/g, '');
}
