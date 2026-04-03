/**
 * Tests for FSBO.com scraper parsing logic.
 * We test the exported pure functions directly to avoid the 2s crawl delay.
 */

import { describe, it, expect } from 'vitest';
import { extractListingUrls, parseListingPage } from '@/lib/lead-gen/sources/fsbo-com';

// ── Sample HTML fixtures ──────────────────────────────────────────────────────

const searchHtml = `
<html><body>
  <a href="/listing/baton-rouge-la/12345/">3BR/2BA in BR</a>
  <a href="/listing/new-orleans-la/67890/">Nice home NOLA</a>
  <a href="/listing/baton-rouge-la/12345/">Duplicate link</a>
  <a href="/search/?page=2">Next page</a>
  <a href="/about/">About</a>
  <a href="/listing/shreveport-la/99999/some-extra-slug/">Valid with extra path</a>
</body></html>
`;

const listingWithPhone = (phone = '(225) 867-5309', email = 'seller@example.com') => `
<html><body>
  <h1>Beautiful 3BR/2BA Home — Baton Rouge, LA</h1>
  <div class="address">123 Oak Street, Baton Rouge, LA 70801</div>
  <span>$285,000</span>
  <div class="description">
    Lovely home in great neighborhood. Call ${phone} or email ${email}.
    Updated kitchen, new roof, move-in ready.
  </div>
</body></html>
`;

const listingEmailOnly = `
<html><body>
  <h1>FSBO 4BR Home</h1>
  <span>$310,000</span>
  <div class="description">Email only: contact@homeowner.com. No calls please.</div>
</body></html>
`;

const listingNoContact = `
<html><body>
  <h1>FSBO Home for Sale</h1>
  <div class="description">Use the secure contact form on this site. No phone or email shown.</div>
</body></html>
`;

const listingWithHtmlEntities = `
<html><body>
  <h1>Home &amp; Garden Estate</h1>
  <div class="description">Call (225) 555-1234. Price: $220,000&nbsp;firm.</div>
</body></html>
`;

// ── extractListingUrls ────────────────────────────────────────────────────────

describe('extractListingUrls', () => {
  it('extracts /listing/ paths and prepends domain', () => {
    const urls = extractListingUrls(searchHtml);
    expect(urls).toContain('https://www.fsbo.com/listing/baton-rouge-la/12345/');
    expect(urls).toContain('https://www.fsbo.com/listing/new-orleans-la/67890/');
  });

  it('deduplicates repeated listing URLs', () => {
    const urls = extractListingUrls(searchHtml);
    const count = urls.filter((u) => u.includes('12345')).length;
    expect(count).toBe(1);
  });

  it('excludes non-listing links', () => {
    const urls = extractListingUrls(searchHtml);
    expect(urls.some((u) => u.includes('about'))).toBe(false);
    expect(urls.some((u) => u.includes('page=2'))).toBe(false);
  });

  it('returns empty array for page with no listings', () => {
    const urls = extractListingUrls('<html><body><p>No listings here.</p></body></html>');
    expect(urls).toEqual([]);
  });
});

// ── parseListingPage ──────────────────────────────────────────────────────────

describe('parseListingPage', () => {
  const url = 'https://www.fsbo.com/listing/baton-rouge-la/12345/';

  it('extracts phone number — strips formatting to digits', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.phone).toBe('2258675309');
  });

  it('extracts email address', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.email).toBe('seller@example.com');
  });

  it('extracts price', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.price).toBe('$285,000');
  });

  it('extracts title from h1', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.title).toMatch(/Beautiful 3BR/);
  });

  it('sets source to fsbo-com', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.source).toBe('fsbo-com');
  });

  it('sets state to LA', () => {
    const lead = parseListingPage(listingWithPhone(), url);
    expect(lead?.state).toBe('LA');
  });

  it('returns lead with email only when no phone present', () => {
    const lead = parseListingPage(listingEmailOnly, url);
    expect(lead).not.toBeNull();
    expect(lead?.email).toBe('contact@homeowner.com');
    expect(lead?.phone).toBeUndefined();
  });

  it('returns null when no phone or email', () => {
    const lead = parseListingPage(listingNoContact, url);
    expect(lead).toBeNull();
  });

  it('strips HTML entities from content', () => {
    const lead = parseListingPage(listingWithHtmlEntities, url);
    expect(lead?.title).not.toContain('&amp;');
    expect(lead?.title).toContain('&');
  });

  it('handles various phone formats', () => {
    const formats = [
      { raw: '225-867-5309', expected: '2258675309' },
      { raw: '225.867.5309', expected: '2258675309' },
      { raw: '2258675309',   expected: '2258675309' },
    ];

    for (const { raw, expected } of formats) {
      const lead = parseListingPage(listingWithPhone(raw, 'x@x.com'), url);
      expect(lead?.phone).toBe(expected);
    }
  });
});
