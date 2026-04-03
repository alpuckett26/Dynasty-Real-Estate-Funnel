import { describe, it, expect } from 'vitest';
import { parseSearchResults, scoreIntent } from '@/lib/lead-gen/sources/city-data';

const searchHtml = `
<html><body>
  <a href="https://www.city-data.com/forum/baton-rouge/1234567-moving-baton-rouge-neighborhood-advice.html">
    Moving to Baton Rouge next month — neighborhood advice needed
  </a>
  <span>by texasmom2024 — posted 01/15/2025</span>

  <a href="https://www.city-data.com/forum/baton-rouge/9876543-buying-home-baton-rouge-first-time.html">
    Buying a home in Baton Rouge as first time buyer — any tips?
  </a>
  <span>by homebuyer_mike — posted 01/14/2025</span>

  <a href="https://www.city-data.com/forum/baton-rouge/1234567-moving-baton-rouge-neighborhood-advice.html">
    Duplicate link — should be deduplicated
  </a>

  <a href="https://www.city-data.com/forum/baton-rouge/1234567-moving-baton-rouge-neighborhood-advice.html#post123">
    Same thread with fragment — should deduplicate
  </a>

  <a href="https://www.city-data.com/about.html">About City-Data</a>
  <a href="/forum/search.php">Search</a>
</body></html>
`;

const noResultsHtml = `
<html><body>
  <h2>No results found</h2>
  <p>Your search returned no matching forum threads.</p>
</body></html>
`;

describe('parseSearchResults', () => {
  it('extracts city-data forum thread links', () => {
    const posts = parseSearchResults(searchHtml);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => p.url.includes('city-data.com/forum'))).toBe(true);
  });

  it('deduplicates URLs including stripping fragments', () => {
    const posts = parseSearchResults(searchHtml);
    const urls = posts.map((p) => p.url);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('strips fragment (#anchor) from URLs', () => {
    const posts = parseSearchResults(searchHtml);
    expect(posts.some((p) => p.url.includes('#'))).toBe(false);
  });

  it('excludes non-forum links', () => {
    const posts = parseSearchResults(searchHtml);
    expect(posts.some((p) => p.url.includes('/about'))).toBe(false);
    expect(posts.some((p) => p.url.includes('search.php'))).toBe(false);
  });

  it('returns empty array when no results', () => {
    const posts = parseSearchResults(noResultsHtml);
    expect(posts).toEqual([]);
  });

  it('sets source-friendly postedAt date', () => {
    const posts = parseSearchResults(searchHtml);
    for (const post of posts) {
      expect(() => new Date(post.postedAt)).not.toThrow();
    }
  });
});

describe('scoreIntent', () => {
  it('identifies buyer intent', () => {
    const result = scoreIntent('looking to buy a home in baton rouge, first time homebuyer, need mortgage advice');
    expect(result.intentType).toBe('buyer');
    expect(result.score).toBeGreaterThan(0);
  });

  it('identifies relocation intent', () => {
    const result = scoreIntent('we are moving to baton rouge next month, accepted a job offer, any advice?');
    expect(result.intentType).toBe('relocating');
    expect(result.score).toBeGreaterThan(0);
  });

  it('prioritises buyer over relocation when both present', () => {
    const result = scoreIntent('relocating to baton rouge and looking to buy a home, first time buyer');
    expect(result.intentType).toBe('buyer');
  });

  it('returns unknown for irrelevant text', () => {
    const result = scoreIntent('what is the best crawfish restaurant in baton rouge');
    expect(result.intentType).toBe('unknown');
    expect(result.score).toBe(0);
  });

  it('caps score at 10', () => {
    const heavy = Array(10).fill('looking to buy buying a home first time homebuyer down payment mortgage').join(' ');
    const result = scoreIntent(heavy);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it('scores school district and neighborhood signals', () => {
    const result = scoreIntent('which neighborhood has the best school district, planning to move with kids');
    expect(result.score).toBeGreaterThan(0);
  });
});
