/**
 * City-Data Forum Monitor
 *
 * Scrapes public forum posts from city-data.com for relocation and
 * homebuying intent signals in the Baton Rouge / Louisiana market.
 *
 * DISABLED as of 2026-08-15. The site is reachable (HTTP 200) but is not a
 * usable lead source, for reasons no amount of parsing fixes:
 *
 *   1. The forum filter is ignored server-side. `forumid=153` (Baton Rouge)
 *      and `forumchoice[]=84` (Louisiana) both return national results — a live
 *      probe for "moving to baton rouge" scoped to Baton Rouge came back with
 *      threads on Florida politics, college football and Asheville, and not one
 *      Louisiana thread in the top 30.
 *   2. Results rank by thread activity, not recency; last posts ranged from
 *      2022 to 2026 on a single page.
 *   3. Forum posts carry no contact details, so every "lead" was a CRM record
 *      with a username and no way to reach anyone.
 *
 * The parser below was still repaired rather than deleted: it had been matching
 * absolute thread URLs that the site stopped emitting (it now uses relative
 * hrefs), so it silently returned zero rows against a page of 603 results. The
 * relevance and recency gates are the ones the broken server-side filter was
 * supposed to provide. If this is ever re-enabled, it now parses real markup
 * and refuses off-topic and stale threads rather than loading them into HubSpot.
 *
 * Forum search: https://www.city-data.com/forum/search.php?query=...&forumid=...
 */

import {
  classifyStatus,
  disabledScan,
  isSourceEnabled,
  summariseHealth,
  type SourceScan,
} from '../source-health';

export interface CityDataLead {
  title: string;
  body: string;
  author: string;
  url: string;
  /** Forum slug the thread lives in, e.g. "baton-rouge". */
  forum: string;
  intentType: 'buyer' | 'relocating' | 'unknown';
  intentScore: number; // 1–10
  postedAt: string;
  source: 'city-data';
}

const FORUM_BASE = 'https://www.city-data.com/forum/';

const SEARCHES = [
  { query: 'moving to baton rouge', forumId: '153' },
  { query: 'buying a home baton rouge', forumId: '153' },
  { query: 'relocating to baton rouge', forumId: '153' },
  { query: 'neighborhoods baton rouge buy', forumId: '153' },
  { query: 'moving to louisiana', forumId: '84' },
  { query: 'buying a home louisiana', forumId: '84' },
];

/** Forum slugs that are actually in-market. */
const LOUISIANA_FORUMS = [
  'baton-rouge', 'louisiana', 'new-orleans', 'lafayette', 'shreveport',
];

/** Place names that make an off-forum thread still locally relevant. */
const LOCATION_TERMS = [
  'baton rouge', 'louisiana', 'denham springs', 'zachary', 'prairieville',
  'gonzales', 'ascension parish', 'livingston parish', 'east baton rouge',
  'walker la', 'central city la',
];

/** A thread whose last post is older than this is not a live prospect. */
const MAX_AGE_DAYS = 60;

const BUYER_KEYWORDS = [
  'looking to buy', 'want to buy', 'buying a home', 'buying a house',
  'first time homebuyer', 'first time buyer', 'pre-approval', 'mortgage',
  'down payment', 'afford', 'budget for a home', 'which neighborhood',
  'best neighborhood to buy', 'school district', 'commute',
];

const RELOCATION_KEYWORDS = [
  'moving to', 'relocating to', 'moving from', 'transferring to',
  'accepted a job', 'job offer', 'starting a new job', 'we are moving',
  'planning to move', 'thinking of moving', 'considering moving',
  'any advice', 'what should i know', 'tips for moving',
];

export async function scanCityData(): Promise<SourceScan<CityDataLead>> {
  const source = 'city-data';
  if (!isSourceEnabled(source)) return disabledScan<CityDataLead>(source);

  const leads: CityDataLead[] = [];
  const seenUrls = new Set<string>();
  let requests = 0;
  const failures = { blocked: 0, error: 0 };

  for (const search of SEARCHES) {
    try {
      const url = `${FORUM_BASE}search.php?query=${encodeURIComponent(search.query)}&forumid=${search.forumId}&do=process`;
      requests++;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.city-data.com/',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        failures[classifyStatus(res.status)]++;
        console.error(`[City-Data] "${search.query}" returned HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const posts = parseSearchResults(html);

      for (const post of posts) {
        if (seenUrls.has(post.url)) continue;
        seenUrls.add(post.url);

        // The server-side forum filter does not work, so scope the results here.
        if (!isLocallyRelevant(post)) continue;
        if (!isRecent(post.postedAt)) continue;

        const combined = `${post.title} ${post.body}`.toLowerCase();
        const { intentType, score } = scoreIntent(combined);

        if (score >= 3) {
          leads.push({ ...post, intentType, intentScore: score, source: 'city-data' });
        }
      }
    } catch (err) {
      failures.error++;
      console.error(`[City-Data] Failed for query "${search.query}":`, err);
    }
  }

  leads.sort((a, b) => b.intentScore - a.intentScore);

  const { health, detail } = summariseHealth(requests, failures);
  return { source, health, detail, leads, requests, failures: failures.blocked + failures.error };
}

export interface RawPost {
  title: string;
  body: string;
  author: string;
  url: string;
  forum: string;
  postedAt: string;
}

/**
 * Parse a vBulletin search-results page.
 *
 * Works row-by-row rather than by scanning loose anchors: each result is one
 * <tr> carrying the thread id, and the row is what ties a title to its author,
 * date and forum. The previous anchor-scanning version matched pagination and
 * navigation links as readily as threads, and required absolute URLs the site
 * no longer emits.
 */
export function parseSearchResults(html: string): RawPost[] {
  const posts: RawPost[] = [];

  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rows) {
    // The anchor carrying id="thread_title_N" is the thread itself; the
    // numbered anchors beside it are just page links into the same thread.
    const link = row.match(
      /<a[^>]+href="([^"]+\.html[^"]*)"[^>]*\bid="thread_title_\d+"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!link) continue;

    const url = absoluteThreadUrl(link[1]);
    if (!url || posts.some((p) => p.url === url)) continue;

    const title = decodeEntities(stripTags(link[2])).trim();
    if (!title || title.length < 10) continue;

    posts.push({
      title: title.slice(0, 200),
      body: extractBody(row, title),
      author: extractAuthor(row),
      url,
      forum: forumSlug(link[1]),
      postedAt: extractLastPostDate(row),
    });
  }

  return posts;
}

/**
 * Thread hrefs are relative to /forum/ ("texas/12345-thread-title.html").
 * Absolute URLs are still accepted so older captures keep parsing.
 */
function absoluteThreadUrl(href: string): string | null {
  const clean = href.split('#')[0].split('?')[0].trim();
  if (!clean.endsWith('.html')) return null;

  if (/^https?:\/\//i.test(clean)) {
    return clean.includes('city-data.com/forum/') ? clean : null;
  }
  if (clean.startsWith('/forum/')) return `https://www.city-data.com${clean}`;
  if (clean.startsWith('/')) return null;

  // Must look like "<forum-slug>/<thread-id>-<slug>.html"
  if (!/^[a-z0-9\-]+\/\d+-/i.test(clean)) return null;
  return `${FORUM_BASE}${clean}`;
}

function forumSlug(href: string): string {
  const clean = href.split('#')[0].split('?')[0];
  const withoutHost = clean.replace(/^https?:\/\/[^/]+\/forum\//i, '').replace(/^\/forum\//, '');
  return withoutHost.split('/')[0] ?? '';
}

/**
 * The row's title attribute holds the post preview, prefixed with the thread
 * title. Strip that prefix so intent scoring is not double-counting the title.
 */
function extractBody(row: string, title: string): string {
  const attr = row.match(/id="td_threadtitle_\d+"[^>]*\btitle="([^"]*)"/i);
  if (!attr) return '';

  let body = decodeEntities(attr[1]).replace(/\s+/g, ' ').trim();
  if (body.toLowerCase().startsWith(title.toLowerCase())) {
    body = body.slice(title.length).trim();
  }
  return body.slice(0, 400);
}

/**
 * Thread starter sits in a bare <div class="smallfont"> inside the title cell.
 * The last-post author lives in a similar div in the *next* cell, so this is
 * anchored to the title cell to avoid picking up the wrong name.
 */
function extractAuthor(row: string): string {
  const titleCell = row.match(/id="td_threadtitle_\d+"[\s\S]*?<\/td>/i);
  const scope = titleCell ? titleCell[0] : row;

  const divs = [...scope.matchAll(/<div class="smallfont"[^>]*>([\s\S]*?)<\/div>/gi)];
  for (const div of divs) {
    const name = decodeEntities(stripTags(div[1])).replace(/\s+/g, ' ').trim();
    // Skip the pagination row ("1 2 3 ... Last Page")
    if (!name || /^[\d\s.]+$/.test(name) || /last page/i.test(name)) continue;
    if (name.length > 40) continue;
    return name;
  }
  return 'Unknown';
}

/** Last-post date, formatted MM-DD-YYYY in the row's date cell. */
function extractLastPostDate(row: string): string {
  const match = row.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return new Date().toISOString();

  const [, mm, dd, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function isLocallyRelevant(post: Pick<RawPost, 'forum' | 'title' | 'body'>): boolean {
  if (LOUISIANA_FORUMS.includes(post.forum.toLowerCase())) return true;

  const text = `${post.title} ${post.body}`.toLowerCase();
  return LOCATION_TERMS.some((term) => text.includes(term));
}

export function isRecent(postedAt: string, maxAgeDays = MAX_AGE_DAYS): boolean {
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return false;

  const ageDays = (Date.now() - posted) / 86_400_000;
  return ageDays <= maxAgeDays;
}

export function scoreIntent(text: string): { intentType: CityDataLead['intentType']; score: number } {
  let buyerHits = 0;
  let relocationHits = 0;

  for (const kw of BUYER_KEYWORDS) if (text.includes(kw)) buyerHits++;
  for (const kw of RELOCATION_KEYWORDS) if (text.includes(kw)) relocationHits++;

  const intentType =
    buyerHits > 0 ? 'buyer' :
    relocationHits > 0 ? 'relocating' : 'unknown';

  const score = Math.min(10, buyerHits * 3 + relocationHits * 2);
  return { intentType, score };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, '');
}
