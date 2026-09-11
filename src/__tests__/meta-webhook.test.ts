/**
 * Tests for the Meta Lead Ads webhook's pure logic.
 *
 * These guard the most expensive failure in the funnel: a paid lead that
 * cannot be ingested is never resent by Meta, so if the webhook swallows the
 * error the lead is simply gone. Every failure path below therefore asserts
 * that the failure is classified and that the alert says how to recover it.
 */

import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';

import {
  MetaGraphError,
  buildLostLeadAlert,
  classifyMetaFailure,
  fetchMetaLead,
  isRetryableStatus,
  mapMetaLead,
  parseGraphErrorCode,
  verifyMetaSignature,
  type MetaLeadResponse,
} from '@/lib/intake/meta-webhook';

const SECRET = 'test-app-secret';

function sign(body: string, secret = SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

function lead(fields: Record<string, string>, extra: Partial<MetaLeadResponse> = {}): MetaLeadResponse {
  return {
    id: 'lead-1',
    field_data: Object.entries(fields).map(([name, value]) => ({ name, values: [value] })),
    ...extra,
  };
}

describe('verifyMetaSignature', () => {
  const body = JSON.stringify({ object: 'page' });

  it('accepts a correctly signed body', () => {
    expect(verifyMetaSignature(body, sign(body), { secret: SECRET })).toEqual({ ok: true });
  });

  it('rejects a body signed with the wrong secret', () => {
    const result = verifyMetaSignature(body, sign(body, 'other-secret'), { secret: SECRET });
    expect(result.ok).toBe(false);
  });

  it('rejects a tampered body', () => {
    const signature = sign(body);
    const result = verifyMetaSignature(body + ' ', signature, { secret: SECRET });
    expect(result.ok).toBe(false);
  });

  it('rejects a missing header', () => {
    const result = verifyMetaSignature(body, null, { secret: SECRET });
    expect(result).toEqual({ ok: false, reason: 'missing x-hub-signature-256 header' });
  });

  // A forged non-hex signature used to reach timingSafeEqual with mismatched
  // buffer lengths, which throws — turning a rejected forgery into a 500.
  it('rejects a non-hex signature without throwing', () => {
    const forged = `sha256=${'z'.repeat(64)}`;
    expect(() => verifyMetaSignature(body, forged, { secret: SECRET })).not.toThrow();
    expect(verifyMetaSignature(body, forged, { secret: SECRET }).ok).toBe(false);
  });

  it('rejects a short hex signature without throwing', () => {
    expect(verifyMetaSignature(body, 'sha256=abcd', { secret: SECRET }).ok).toBe(false);
  });

  // The endpoint is public and its URL is documented, so an unset secret in
  // production would let anyone POST fake leads straight into HubSpot.
  it('fails closed in production when the app secret is missing', () => {
    const result = verifyMetaSignature(body, sign(body), { secret: '', isProduction: true });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toContain('META_APP_SECRET');
  });

  it('stays permissive locally when the app secret is missing', () => {
    expect(verifyMetaSignature(body, null, { secret: '', isProduction: false })).toEqual({ ok: true });
  });
});

describe('classifyMetaFailure', () => {
  it('treats an expired page token as a config failure naming the env var', () => {
    const body = JSON.stringify({ error: { code: 190, message: 'Error validating access token' } });
    const failure = classifyMetaFailure(new MetaGraphError(400, body, parseGraphErrorCode(body)));
    expect(failure.kind).toBe('config');
    expect(failure.detail).toContain('META_PAGE_ACCESS_TOKEN');
  });

  it('treats a 401 as a config failure', () => {
    expect(classifyMetaFailure(new MetaGraphError(401, 'unauthorized')).kind).toBe('config');
  });

  it('treats a 403 as a permissions problem', () => {
    const failure = classifyMetaFailure(new MetaGraphError(403, 'forbidden'));
    expect(failure.kind).toBe('config');
    expect(failure.detail).toContain('leads_retrieval');
  });

  it('treats a persistent 500 as transient', () => {
    expect(classifyMetaFailure(new MetaGraphError(500, 'boom')).kind).toBe('transient');
  });

  it('treats a missing token as a config failure', () => {
    const failure = classifyMetaFailure(new Error('META_PAGE_ACCESS_TOKEN not configured'));
    expect(failure.kind).toBe('config');
    expect(failure.detail).toContain('not set in Vercel');
  });

  // The form field names changed and nothing mapped — the lead arrived but had
  // no reachable contact details.
  it('explains an unmappable lead as a form field problem', () => {
    const failure = classifyMetaFailure(
      new Error('Lead must include at least an email or phone number')
    );
    expect(failure.kind).toBe('permanent');
    expect(failure.detail).toContain('Instant Form field names');
  });
});

describe('isRetryableStatus', () => {
  it('retries rate limits and server errors only', () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(403)).toBe(false);
  });
});

describe('fetchMetaLead', () => {
  const noSleep = async () => {};

  function respond(queue: Array<{ ok: boolean; status: number; body?: unknown }>) {
    let calls = 0;
    const impl = vi.fn(async () => {
      const next = queue[Math.min(calls, queue.length - 1)];
      calls++;
      return {
        ok: next.ok,
        status: next.status,
        json: async () => next.body ?? {},
        text: async () => (typeof next.body === 'string' ? next.body : JSON.stringify(next.body ?? {})),
      } as unknown as Response;
    });
    return { impl, calls: () => calls };
  }

  it('returns the lead on the first success', async () => {
    const { impl, calls } = respond([{ ok: true, status: 200, body: { id: 'lead-1' } }]);
    const lead = await fetchMetaLead('lead-1', { token: 't', fetchImpl: impl, sleep: noSleep });
    expect(lead.id).toBe('lead-1');
    expect(calls()).toBe(1);
  });

  // A 500 or a rate-limit usually clears immediately; giving up on the first
  // one would throw away a lead that was already paid for.
  it('retries a server error and succeeds on a later attempt', async () => {
    const { impl, calls } = respond([
      { ok: false, status: 500, body: 'boom' },
      { ok: true, status: 200, body: { id: 'lead-2' } },
    ]);
    const lead = await fetchMetaLead('lead-2', { token: 't', fetchImpl: impl, sleep: noSleep });
    expect(lead.id).toBe('lead-2');
    expect(calls()).toBe(2);
  });

  it('retries a rate limit', async () => {
    const { impl, calls } = respond([
      { ok: false, status: 429, body: 'slow down' },
      { ok: true, status: 200, body: { id: 'lead-3' } },
    ]);
    await fetchMetaLead('lead-3', { token: 't', fetchImpl: impl, sleep: noSleep });
    expect(calls()).toBe(2);
  });

  it('gives up after three attempts and reports the last error', async () => {
    const { impl, calls } = respond([{ ok: false, status: 503, body: 'down' }]);
    await expect(
      fetchMetaLead('lead-4', { token: 't', fetchImpl: impl, sleep: noSleep })
    ).rejects.toBeInstanceOf(MetaGraphError);
    expect(calls()).toBe(3);
  });

  // An expired token answers the same way every time, so retrying only delays
  // the alert that someone needs to rotate it.
  it('does not retry an expired token', async () => {
    const { impl, calls } = respond([
      { ok: false, status: 400, body: { error: { code: 190, message: 'expired' } } },
    ]);
    await expect(
      fetchMetaLead('lead-5', { token: 't', fetchImpl: impl, sleep: noSleep })
    ).rejects.toMatchObject({ status: 400, errorCode: 190 });
    expect(calls()).toBe(1);
  });

  it('does not retry a 403', async () => {
    const { impl, calls } = respond([{ ok: false, status: 403, body: 'forbidden' }]);
    await expect(
      fetchMetaLead('lead-6', { token: 't', fetchImpl: impl, sleep: noSleep })
    ).rejects.toBeInstanceOf(MetaGraphError);
    expect(calls()).toBe(1);
  });

  it('retries a network failure', async () => {
    let calls = 0;
    const impl = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('ECONNRESET');
      return { ok: true, status: 200, json: async () => ({ id: 'lead-7' }) } as unknown as Response;
    });
    const lead = await fetchMetaLead('lead-7', { token: 't', fetchImpl: impl, sleep: noSleep });
    expect(lead.id).toBe('lead-7');
    expect(calls).toBe(2);
  });
});

describe('buildLostLeadAlert', () => {
  it('names the lead and how to recover it by hand', () => {
    const alert = buildLostLeadAlert([
      {
        leadgenId: 'lead-123',
        adId: 'ad-9',
        failure: { kind: 'permanent', detail: 'something broke' },
      },
    ]);

    expect(alert).toContain('lead-123');
    expect(alert).toContain('ad-9');
    expect(alert).toContain('Download leads');
    expect(alert).toContain('not in HubSpot');
  });

  it('warns that spend continues when the cause is configuration', () => {
    const alert = buildLostLeadAlert([
      {
        leadgenId: 'lead-1',
        failure: { kind: 'config', detail: 'token expired' },
      },
    ]);
    expect(alert).toContain('ads keep spending');
  });

  it('does not warn about ongoing spend for a one-off failure', () => {
    const alert = buildLostLeadAlert([
      { leadgenId: 'lead-1', failure: { kind: 'permanent', detail: 'odd lead' } },
    ]);
    expect(alert).not.toContain('ads keep spending');
  });

  it('lists the received field names so a mapping gap can be fixed', () => {
    const alert = buildLostLeadAlert([
      {
        leadgenId: 'lead-1',
        failure: { kind: 'permanent', detail: 'no usable email or phone' },
        fieldNames: ['mobile_number', 'full_name'],
      },
    ]);
    expect(alert).toContain('mobile_number');
  });
});

describe('mapMetaLead', () => {
  it('maps a standard instant form submission', () => {
    const mapped = mapMetaLead(
      lead({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone_number: '+1 (225) 555-1234',
        are_you_buying_or_selling: 'Buying',
        when_are_you_looking_to_move: 'ASAP',
        are_you_pre_approved: 'Yes, pre-approved',
        what_area_are_you_interested_in: 'Zachary',
      }),
      'ad-1'
    );

    expect(mapped).toMatchObject({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+12255551234',
      intent: 'buyer',
      timeline: 'now',
      financingStatus: 'pre-approved',
      areasOfInterest: 'Zachary',
      source: 'meta-lead-ad',
    });
  });

  it('splits a full name when first/last are not sent separately', () => {
    const mapped = mapMetaLead(lead({ full_name: 'Marcus Allen Brown', email: 'm@example.com' }));
    expect(mapped.firstName).toBe('Marcus');
    expect(mapped.lastName).toBe('Allen Brown');
  });

  // SMS consent is a legal question, not a convenience one: it may only come
  // from an explicit checkbox on the form.
  it('never infers SMS consent from a submission alone', () => {
    const mapped = mapMetaLead(lead({ full_name: 'Jane Smith', phone_number: '2255551234' }));
    expect(mapped.consentSms).toBe(false);
    expect(mapped.consentEmail).toBe(true);
  });

  it('honors an explicit SMS consent checkbox', () => {
    const mapped = mapMetaLead(
      lead({ full_name: 'Jane Smith', phone_number: '2255551234', i_agree_to_receive_texts: 'Yes' })
    );
    expect(mapped.consentSms).toBe(true);
  });

  it('detects a seller and a both-intent lead', () => {
    expect(mapMetaLead(lead({ intent: 'Selling my home' })).intent).toBe('seller');
    expect(mapMetaLead(lead({ intent: 'Buying and selling' })).intent).toBe('both');
  });

  it('falls back through campaign, ad name, then ad id for attribution', () => {
    expect(mapMetaLead(lead({}), 'ad-7').utmCampaign).toBe('ad-7');
    expect(mapMetaLead(lead({}, { ad_name: 'DPA Quiz' }), 'ad-7').utmCampaign).toBe('DPA Quiz');
    expect(
      mapMetaLead(lead({}, { campaign_name: 'Healthcare Hero', ad_name: 'DPA Quiz' })).utmCampaign
    ).toBe('Healthcare Hero');
  });

  it('ignores fields Meta sends with no value', () => {
    const empty: MetaLeadResponse = {
      id: 'lead-1',
      field_data: [{ name: 'email', values: [] }, { name: 'full_name', values: ['Jane Smith'] }],
    };
    expect(mapMetaLead(empty).email).toBe('');
    expect(mapMetaLead(empty).firstName).toBe('Jane');
  });
});
