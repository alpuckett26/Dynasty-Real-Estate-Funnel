/**
 * Tests for the Craigslist RSS parser.
 * No network calls — we feed it fake XML.
 */

import { describe, it, expect, vi } from 'vitest';

// We need to access the private parseRSSItems / extractLeadFromItem functions.
// We do this by importing the module and exercising the public function
// with a mocked fetch response.

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

describe('scrapeCraigslistFSBO (with mocked fetch)', () => {
  it('returns leads that have phone or email, skips items without contact info', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleRSS,
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();

    // Item 1: has phone + email — should be included (once per market, but 2 markets so 2 or 4)
    // Item 2: no contact info — should be excluded
    // Item 3: email only — should be included
    // 2 markets × 2 valid items = 4 leads
    expect(leads.length).toBe(4);
    expect(leads.every((l) => l.phone || l.email)).toBe(true);
  });

  it('extracts phone number correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleRSS,
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();
    const withPhone = leads.find((l) => l.phone);
    expect(withPhone?.phone).toBe('2258675309');
  });

  it('extracts email correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleRSS,
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();
    const withEmail = leads.find((l) => l.email === 'john@example.com');
    expect(withEmail).toBeTruthy();
  });

  it('extracts price correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleRSS,
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();
    const withPrice = leads.find((l) => l.price);
    expect(withPrice?.price).toMatch(/\$245,000/);
  });

  it('sets source to craigslist-fsbo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleRSS,
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();
    expect(leads.every((l) => l.source === 'craigslist-fsbo')).toBe(true);
  });

  it('returns empty array when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const leads = await CL.scrapeCraigslistFSBO();
    expect(leads).toEqual([]);
  });

  it('returns empty array when feed returns non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    } as Response);

    const leads = await CL.scrapeCraigslistFSBO();
    expect(leads).toEqual([]);
  });
});
