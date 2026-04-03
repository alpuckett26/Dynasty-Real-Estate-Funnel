import { describe, it, expect } from 'vitest';
import { parseForumPosts, scoreIntent } from '@/lib/lead-gen/sources/biggerpockets';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const searchHtml = `
<html><body>
  <a href="/forums/thread/12345/looking-to-invest-in-baton-rouge">
    Looking to invest in Baton Rouge — need boots on the ground agent
  </a>
  <p>by Marcus Johnson — investor from Texas looking to buy and hold rentals</p>

  <a href="/forums/thread/67890/louisiana-market-analysis">
    Louisiana multifamily market — any cash flow opportunities?
  </a>
  <p>by Sarah K — analyzing cap rate and deal analysis in New Orleans area</p>

  <a href="/about/">About BiggerPockets</a>
  <a href="/forums/thread/12345/looking-to-invest-in-baton-rouge">Duplicate</a>
</body></html>
`;

const noForumPostsHtml = `
<html><body>
  <h1>Search Results</h1>
  <p>No results found for your query.</p>
</body></html>
`;

// ── parseForumPosts ───────────────────────────────────────────────────────────

describe('parseForumPosts', () => {
  it('extracts thread links with titles', () => {
    const posts = parseForumPosts(searchHtml);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.some((p) => p.title.toLowerCase().includes('baton rouge'))).toBe(true);
  });

  it('deduplicates posts with the same URL', () => {
    const posts = parseForumPosts(searchHtml);
    const urls = posts.map((p) => p.url);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('prepends full BiggerPockets domain to URLs', () => {
    const posts = parseForumPosts(searchHtml);
    expect(posts.every((p) => p.url.startsWith('https://www.biggerpockets.com'))).toBe(true);
  });

  it('excludes non-thread links', () => {
    const posts = parseForumPosts(searchHtml);
    expect(posts.some((p) => p.url.includes('/about/'))).toBe(false);
  });

  it('returns empty array when no forum posts found', () => {
    const posts = parseForumPosts(noForumPostsHtml);
    expect(posts).toEqual([]);
  });
});

// ── scoreIntent ───────────────────────────────────────────────────────────────

describe('scoreIntent', () => {
  it('identifies investor intent', () => {
    const result = scoreIntent('looking to invest in baton rouge, want cash flow and good cap rate');
    expect(result.intentType).toBe('investor');
    expect(result.score).toBeGreaterThan(0);
  });

  it('identifies buyer intent', () => {
    const result = scoreIntent('looking to buy a single family home, first property, moving to louisiana');
    expect(result.intentType).toBe('buyer');
    expect(result.score).toBeGreaterThan(0);
  });

  it('identifies seller intent', () => {
    const result = scoreIntent('selling my property, need to list off market, exit strategy');
    expect(result.intentType).toBe('seller');
    expect(result.score).toBeGreaterThan(0);
  });

  it('prioritises investor over buyer', () => {
    const result = scoreIntent('looking to buy and hold, brrrr strategy, need local agent boots on the ground');
    expect(result.intentType).toBe('investor');
  });

  it('returns unknown for irrelevant text', () => {
    const result = scoreIntent('what is the best pizza place in louisiana');
    expect(result.intentType).toBe('unknown');
    expect(result.score).toBe(0);
  });

  it('caps score at 10', () => {
    const heavy = Array(10).fill('looking to invest cash flow cap rate deal analysis buy and hold brrrr').join(' ');
    const result = scoreIntent(heavy);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it('scores agent referral signals', () => {
    const result = scoreIntent('need an agent in baton rouge, recommend a local agent boots on the ground');
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.intentType).toBe('investor');
  });
});
