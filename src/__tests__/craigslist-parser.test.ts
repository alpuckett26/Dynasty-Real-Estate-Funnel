/**
 * Tests for the Craigslist RSS parser.
 * No network calls — we feed it fake XML.
 *
 * The source is disabled by default (HTTP 403 from every IP as of 2026-08-15),
 * so these enable it explicitly to exercise the parser.
 *
 * Two tests here used to assert "returns empty array when feed returns non-ok
 * status". That was the silent-failure bug written down as a requirement: an
 * empty array is what a 403 and a quiet day both looked like. They now assert
 * the source reports *why* it came back empty.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as CL from '@/lib/lead-gen/sources/craigslist';

const sampleRSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Baton Rouge FSBO</title>
    <item>
      <title>3BR/2BA FSBO $245,000 Baton Rouge</title>
      <description><![CDATA[Selling by owner. Call (225) 867-5309 or email john@example.com. Nice house in great neighborhood. $245,000]]></description>
      <link>https://batonrouge.craigslist.org/reo/123456.html</link>
      <pubDate>Thu, 03 Apr 2025 08:00:00 +0000</pubDate>
    </item>
    <item>
      <title>FSBO 4/3 home</title>
      <description><![CDATA[No contact info here, just a description.]]></description>
      <link>https://batonrouge.craigslist.org/reo/999999.html</link>
      <pubDate>Thu, 03 Apr 2025 07:00:00 +0000</pubDate>
    </item>
    <item>
      <title>Price reduced — email only</title>
      <description><![CDATA[Contact seller@test.com for details. $180k firm.]]></description>
      <link>https://batonrouge.craigslist.org/reo/111111.html</link>
      <pubDate>Thu, 03 Apr 2025 06:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

const okFetch = () =>
  vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => sampleRSS } as Response);

beforeEach(() => {
  process.env.LEADGEN_ENABLE_CRAIGSLIST_FSBO = 'true';
});

afterEach(() => {
  delete process.env.LEADGEN_ENABLE_CRAIGSLIST_FSBO;
  vi.restoreAllMocks();
});

describe('scrapeCraigslistFSBO (with mocked fetch)', () => {
  it('returns leads that have phone or email, skips items without contact info', async () => {
    global.fetch = okFetch();

    const scan = await CL.scrapeCraigslistFSBO();

    // Item 1: has phone + email — included. Item 2: no contact info — excluded.
    // Item 3: email only — included. 2 markets × 2 valid items = 4 leads.
    expect(scan.leads.length).toBe(4);
    expect(scan.leads.every((l) => l.phone || l.email)).toBe(true);
    expect(scan.health).toBe('ok');
  });

  it('extracts phone number correctly', async () => {
    global.fetch = okFetch();

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads.find((l) => l.phone)?.phone).toBe('2258675309');
  });

  it('extracts email correctly', async () => {
    global.fetch = okFetch();

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads.find((l) => l.email === 'john@example.com')).toBeTruthy();
  });

  it('extracts price correctly', async () => {
    global.fetch = okFetch();

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads.find((l) => l.price)?.price).toMatch(/\$245,000/);
  });

  it('sets source to craigslist-fsbo', async () => {
    global.fetch = okFetch();

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads.every((l) => l.source === 'craigslist-fsbo')).toBe(true);
  });

  it('reports an error, not just emptiness, when the fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads).toEqual([]);
    expect(scan.health).toBe('error');
    expect(scan.failures).toBe(2); // one per market
  });

  it('reports blocked — not a quiet day — when the feed returns 403', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => '' } as Response);

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads).toEqual([]);
    expect(scan.health).toBe('blocked');
    expect(scan.detail).toMatch(/refused/i);
  });

  it('reports an error for a non-blocking failure status', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' } as Response);

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.leads).toEqual([]);
    expect(scan.health).toBe('error');
  });

  it('does not touch the network at all while disabled', async () => {
    delete process.env.LEADGEN_ENABLE_CRAIGSLIST_FSBO;
    const fetchSpy = okFetch();
    global.fetch = fetchSpy;

    const scan = await CL.scrapeCraigslistFSBO();
    expect(scan.health).toBe('disabled');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
