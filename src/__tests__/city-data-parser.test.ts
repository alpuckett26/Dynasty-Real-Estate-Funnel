import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseSearchResults,
  scoreIntent,
  isLocallyRelevant,
  isRecent,
} from '@/lib/lead-gen/sources/city-data';

/**
 * Parsed against markup captured from the live site rather than hand-written
 * HTML. The previous fixture invented absolute thread URLs; the site serves
 * relative ones, so the parser passed every test while returning nothing in
 * production against a page of 603 results.
 */
const liveHtml = readFileSync(
  join(__dirname, 'fixtures', 'city-data-search.html'),
  'utf8'
);

const noResultsHtml = `
<html><body>
  <h2>No results found</h2>
  <p>Your search returned no matching forum threads.</p>
</body></html>
`;

describe('parseSearchResults', () => {
  it('extracts threads from the markup the site actually serves', () => {
    const posts = parseSearchResults(liveHtml);
    expect(posts.length).toBeGreaterThan(0);
  });

  it('resolves relative thread hrefs to absolute URLs', () => {
    const posts = parseSearchResults(liveHtml);
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.url).toMatch(/^https:\/\/www\.city-data\.com\/forum\/[a-z0-9-]+\/\d+-.*\.html$/i);
    }
  });

  it('strips the ?highlight= query and any fragment', () => {
    const posts = parseSearchResults(liveHtml);
    expect(posts.some((p) => p.url.includes('?'))).toBe(false);
    expect(posts.some((p) => p.url.includes('#'))).toBe(false);
  });

  it('deduplicates threads that appear more than once', () => {
    const posts = parseSearchResults(liveHtml);
    const urls = posts.map((p) => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('ignores the per-page pagination links inside a result row', () => {
    // Rows carry "1 2 3 ... Last Page" anchors pointing at -2.html, -3.html etc.
    const posts = parseSearchResults(liveHtml);
    expect(posts.some((p) => /-\d+\.html$/.test(p.url.replace(/\/\d+-/, '/')))).toBe(false);
  });

  it('captures the thread starter rather than the last-post author', () => {
    const posts = parseSearchResults(liveHtml);
    const southern = posts.find((p) => p.title.includes('Southern City Feels Less Southern'));
    expect(southern).toBeDefined();
    // Row lists starter SouthernBoy205 and last poster Redlionjr.
    expect(southern!.author).toBe('SouthernBoy205');
  });

  it('captures the forum slug each thread lives in', () => {
    const posts = parseSearchResults(liveHtml);
    const southern = posts.find((p) => p.title.includes('Southern City Feels Less Southern'));
    expect(southern!.forum).toBe('city-vs-city');
  });

  it('extracts the post preview without repeating the title', () => {
    const posts = parseSearchResults(liveHtml);
    const southern = posts.find((p) => p.title.includes('Southern City Feels Less Southern'));
    expect(southern!.body.length).toBeGreaterThan(0);
    expect(southern!.body.startsWith(southern!.title)).toBe(false);
    expect(southern!.body).toContain('Huntsville');
  });

  it('parses the last-post date instead of defaulting to today', () => {
    const posts = parseSearchResults(liveHtml);
    const southern = posts.find((p) => p.title.includes('Southern City Feels Less Southern'));
    expect(southern!.postedAt.startsWith('2026-03-14')).toBe(true);
  });

  it('returns an empty array when there are no results', () => {
    expect(parseSearchResults(noResultsHtml)).toEqual([]);
  });

  it('produces valid dates for every post', () => {
    for (const post of parseSearchResults(liveHtml)) {
      expect(Number.isNaN(new Date(post.postedAt).getTime())).toBe(false);
    }
  });
});

describe('isLocallyRelevant', () => {
  it('accepts threads in a Louisiana forum', () => {
    expect(isLocallyRelevant({ forum: 'baton-rouge', title: 'Schools?', body: '' })).toBe(true);
    expect(isLocallyRelevant({ forum: 'louisiana', title: 'Schools?', body: '' })).toBe(true);
  });

  it('accepts off-forum threads that name the market', () => {
    expect(
      isLocallyRelevant({ forum: 'general-u-s', title: 'Moving to Baton Rouge', body: '' })
    ).toBe(true);
  });

  it('rejects the national noise the broken forum filter lets through', () => {
    // Every one of these came back from a search scoped to forum 153, Baton Rouge.
    const posts = parseSearchResults(liveHtml);
    const offTopic = posts.filter((p) => !isLocallyRelevant(p));
    expect(offTopic.length).toBeGreaterThan(0);
    expect(offTopic.some((p) => p.forum === 'college-football' || p.forum === 'weather' ||
      p.forum === 'city-vs-city' || p.forum === 'politics-other-controversies')).toBe(true);
  });
});

describe('isRecent', () => {
  it('accepts a thread posted today', () => {
    expect(isRecent(new Date().toISOString())).toBe(true);
  });

  it('rejects the years-old threads the search ranks highly', () => {
    expect(isRecent('2022-09-28T00:00:00.000Z')).toBe(false);
  });

  it('rejects an unparseable date rather than treating it as fresh', () => {
    expect(isRecent('not a date')).toBe(false);
  });

  it('honours a custom age window', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    expect(isRecent(tenDaysAgo, 30)).toBe(true);
    expect(isRecent(tenDaysAgo, 5)).toBe(false);
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
    expect(scoreIntent(heavy).score).toBeLessThanOrEqual(10);
  });

  it('scores school district and neighborhood signals', () => {
    const result = scoreIntent('which neighborhood has the best school district, planning to move with kids');
    expect(result.score).toBeGreaterThan(0);
  });
});
