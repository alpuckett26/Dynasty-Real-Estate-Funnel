/**
 * Pure logic for the Meta Lead Ads webhook.
 *
 * Kept out of the route handler so it can be tested without a running server:
 * this is the #1 paid lead source, and until now none of its signature
 * checking, field mapping or failure handling was exercised by a single test.
 *
 * The bug class guarded against here is the one that hid the scrapers being
 * dead for months — a failure that returns a cheerful 200 and is never seen
 * again. A Meta lead that fails to ingest is worse than a dead scraper: it was
 * paid for, Meta considers it delivered, and it is never resent.
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ── Signature verification ────────────────────────────────────────────────────

/**
 * Verify Meta's `x-hub-signature-256` header over the raw request body.
 *
 * Fails CLOSED when META_APP_SECRET is missing in production: this endpoint is
 * public and its URL is published in docs/GO-LIVE.md, so an unverified POST
 * would let anyone inject fake leads — texting Adreanne and burning her
 * follow-up time on contacts that never existed. Locally an unset secret still
 * skips verification so the route can be exercised without Meta credentials.
 */
export function verifyMetaSignature(
  body: string,
  header: string | null,
  opts: { secret?: string; isProduction?: boolean } = {}
): { ok: true } | { ok: false; reason: string } {
  const secret = opts.secret ?? process.env.META_APP_SECRET;
  const isProduction =
    opts.isProduction ?? (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === 'production';

  if (!secret) {
    if (isProduction) {
      return {
        ok: false,
        reason: 'META_APP_SECRET is not set — refusing unverified lead in production',
      };
    }
    return { ok: true }; // local dev without Meta credentials
  }

  if (!header?.startsWith('sha256=')) {
    return { ok: false, reason: 'missing x-hub-signature-256 header' };
  }

  const received = header.slice('sha256='.length);
  // Buffer.from(…, 'hex') truncates silently on non-hex input, which would make
  // timingSafeEqual throw on a length mismatch and turn a forged signature into
  // a 500. Reject anything that is not a clean hex digest first.
  if (!/^[0-9a-f]+$/i.test(received)) {
    return { ok: false, reason: 'signature is not hex' };
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (expected.length !== received.length) {
    return { ok: false, reason: 'signature length mismatch' };
  }

  const equal = timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  return equal ? { ok: true } : { ok: false, reason: 'signature mismatch' };
}

// ── Graph API errors ──────────────────────────────────────────────────────────

export class MetaGraphError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    readonly errorCode?: number
  ) {
    super(`Graph API ${status}: ${body.slice(0, 300)}`);
    this.name = 'MetaGraphError';
  }
}

/** Pull Meta's numeric error code out of a Graph error body, if present. */
export function parseGraphErrorCode(body: string): number | undefined {
  try {
    const parsed = JSON.parse(body) as { error?: { code?: number } };
    return typeof parsed.error?.code === 'number' ? parsed.error.code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 429 and 5xx are worth retrying in-request; everything else is answered the
 * same way no matter how many times we ask.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export type FailureKind = 'config' | 'transient' | 'permanent';

export interface MetaFailure {
  kind: FailureKind;
  /** What to tell Adreanne — plain language, names the thing to fix. */
  detail: string;
}

/**
 * Classify an ingest failure so the alert can say what is actually wrong.
 *
 * `config` means every future lead will fail the same way until someone
 * changes an env var — the expensive case, because ad spend keeps running.
 */
export function classifyMetaFailure(err: unknown): MetaFailure {
  if (err instanceof MetaGraphError) {
    // 190 = invalid/expired OAuth token, 102 = session expired. Page tokens die
    // when the password changes or the underlying user token lapses.
    if (err.errorCode === 190 || err.errorCode === 102 || err.status === 401) {
      return {
        kind: 'config',
        detail:
          'META_PAGE_ACCESS_TOKEN is expired or invalid — regenerate the Page token ' +
          '(needs the leads_retrieval permission) and update it in Vercel',
      };
    }
    if (err.status === 403) {
      return {
        kind: 'config',
        detail:
          'Meta refused the lead (403) — the Page token is likely missing the ' +
          'leads_retrieval permission, or the app lost access to the Page',
      };
    }
    if (isRetryableStatus(err.status)) {
      return {
        kind: 'transient',
        detail: `Meta returned ${err.status} and kept failing on retry`,
      };
    }
    return { kind: 'permanent', detail: err.message };
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('META_PAGE_ACCESS_TOKEN')) {
    return {
      kind: 'config',
      detail: 'META_PAGE_ACCESS_TOKEN is not set in Vercel — no Meta lead can be retrieved without it',
    };
  }

  // processIntakeLead's own guard. Means the Instant Form's field names did not
  // match anything we map, so the contact details never made it through.
  if (/at least an email or phone/i.test(message)) {
    return {
      kind: 'permanent',
      detail: 'the lead arrived with no usable email or phone — check the Instant Form field names',
    };
  }

  return { kind: 'permanent', detail: message };
}

// ── Alerting ──────────────────────────────────────────────────────────────────

export interface LostLead {
  leadgenId: string;
  adId?: string;
  failure: MetaFailure;
  /** Field names Meta actually sent, when we got far enough to see them. */
  fieldNames?: string[];
}

/**
 * The message Adreanne gets when a paid lead could not be ingested.
 *
 * It has to carry the recovery path, not just the bad news: Meta keeps every
 * submission downloadable from the Forms Library, so a lost lead is only truly
 * lost if nobody is told to go and get it.
 */
export function buildLostLeadAlert(lost: LostLead[]): string {
  const plural = lost.length > 1 ? 's' : '';
  const lines = lost.map((l) => {
    const bits = [`• lead ${l.leadgenId}${l.adId ? ` (ad ${l.adId})` : ''} — ${l.failure.detail}`];
    if (l.fieldNames?.length) bits.push(`  form fields received: ${l.fieldNames.join(', ')}`);
    return bits.join('\n');
  });

  const configBroken = lost.some((l) => l.failure.kind === 'config');

  return (
    `⚠️ ATR Meta Lead Ads — ${lost.length} paid lead${plural} could NOT be saved\n\n` +
    `${lines.join('\n')}\n\n` +
    `These are not in HubSpot and nobody has been contacted. Download them from\n` +
    `Meta Business Suite → All Tools → Instant Forms → your form → Download leads.` +
    (configBroken
      ? `\n\nEvery new lead will keep failing the same way until this is fixed, ` +
        `while the ads keep spending.`
      : '')
  );
}

// ── Graph API retrieval ───────────────────────────────────────────────────────

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const MAX_ATTEMPTS = 3;

/**
 * Fetch a submission from the Graph API, retrying only what retrying can fix.
 *
 * An expired Page token answers 190 every time, so retrying it just delays the
 * alert; a 500 or a rate-limit usually clears within a second. Worst case this
 * spends ~750ms before giving up, well inside Meta's delivery timeout.
 */
export async function fetchMetaLead(
  leadgenId: string,
  opts: {
    token: string;
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<MetaLeadResponse> {
  const doFetch = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const url =
    `${GRAPH_API}/${leadgenId}` +
    `?fields=id,created_time,field_data,campaign_name,ad_name` +
    `&access_token=${encodeURIComponent(opts.token)}`;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await doFetch(url);
      if (res.ok) return (await res.json()) as MetaLeadResponse;

      const text = await res.text();
      const error = new MetaGraphError(res.status, text, parseGraphErrorCode(text));
      if (!isRetryableStatus(res.status)) throw error;
      lastError = error;
    } catch (err) {
      // A non-retryable Graph error must not be swallowed by the network catch.
      if (err instanceof MetaGraphError && !isRetryableStatus(err.status)) throw err;
      lastError = err;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(250 * attempt);
  }

  throw lastError;
}

// ── Instant Form field mapping ────────────────────────────────────────────────

export interface MetaLeadResponse {
  id: string;
  created_time?: string;
  field_data?: Array<{ name: string; values: string[] }>;
  campaign_name?: string;
  ad_name?: string;
}

export function toFieldMap(lead: MetaLeadResponse): Map<string, string> {
  const fields = new Map<string, string>();
  for (const f of lead.field_data ?? []) {
    if (f.values?.[0]) fields.set(f.name.toLowerCase().trim(), f.values[0]);
  }
  return fields;
}

export function extractName(fields: Map<string, string>): { firstName: string; lastName: string } {
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

export function extractIntent(fields: Map<string, string>): 'buyer' | 'seller' | 'both' | 'unknown' {
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

export function extractTimeline(
  fields: Map<string, string>
): 'now' | '30-60d' | '3-6m' | '6m+' | 'researching' {
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

export function extractFinancing(
  fields: Map<string, string>
): 'pre-approved' | 'need-lender' | 'need-dpa' | 'need-credit-repair' | 'unsure' {
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

export function matchesYes(fields: Map<string, string>, keys: string[]): boolean {
  for (const key of keys) {
    const v = fields.get(key)?.toLowerCase();
    if (v && /yes|true|1|checked|agree/.test(v)) return true;
  }
  return false;
}

/** Meta sends E.164 like "+12255551234" — keep it; intake accepts any 7+ char string. */
export function normalizeMetaPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/** Map an Instant Form submission onto the shared intake shape. */
export function mapMetaLead(lead: MetaLeadResponse, adId?: string) {
  const fields = toFieldMap(lead);
  const { firstName, lastName } = extractName(fields);

  return {
    firstName,
    lastName,
    email: fields.get('email') ?? '',
    phone: normalizeMetaPhone(fields.get('phone_number') ?? fields.get('phone') ?? ''),
    contactPreference: 'call' as const,
    intent: extractIntent(fields),
    firstTimeHomebuyer: matchesYes(fields, [
      'first_time_homebuyer',
      'first-time buyer',
      'first_time_buyer',
    ]),
    healthcareWorker: matchesYes(fields, ['healthcare_worker', 'healthcare worker']),
    areasOfInterest:
      fields.get('area') ??
      fields.get('city') ??
      fields.get('areas_of_interest') ??
      fields.get('what_area_are_you_interested_in') ??
      undefined,
    timeline: extractTimeline(fields),
    financingStatus: extractFinancing(fields),
    // Consent: submitting the form = email follow-up consent (form disclaimer covers it).
    // SMS consent ONLY from an explicit checkbox field on the Instant Form.
    consentEmail: true,
    consentSms: matchesYes(fields, [
      'sms_consent',
      'text_consent',
      'can_we_text_you',
      'i_agree_to_receive_texts',
    ]),
    source: 'meta-lead-ad',
    utmSource: 'facebook',
    utmMedium: 'paid-social',
    utmCampaign: lead.campaign_name ?? lead.ad_name ?? adId ?? 'meta-leadgen',
  };
}
