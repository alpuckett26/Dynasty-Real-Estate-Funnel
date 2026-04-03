/**
 * City-Data Forum Monitor
 *
 * Scrapes public forum posts from city-data.com for relocation and
 * homebuying intent signals in the Baton Rouge / Louisiana market.
 *
 * Target: people actively researching a move to the area — high intent,
 * early in their journey. They're asking locals for advice on neighborhoods,
 * schools, and the housing market.
 *
 * City-Data forums are fully public HTML — no auth required.
 * Forum search: https://www.city-data.com/forum/search.php?query=...&forumid=...
 *
 * Key forums:
 * - Forum 153: Baton Rouge
 * - Forum 84:  Louisiana
 * - Forum 18:  Moving (national, filter by Louisiana mentions)
 */

export interface CityDataLead {
  title: string;
  body: string;
  author: string;
  url: string;
  intentType: 'buyer' | 'relocating' | 'unknown';
  intentScore: number; // 1–10
  postedAt: string;
  source: 'city-data';
}

const SEARCHES = [
  { query: 'moving to baton rouge', forumId: '153' },
  { query: 'buying a home baton rouge', forumId: '153' },
  { query: 'relocating to baton rouge', forumId: '153' },
  { query: 'neighborhoods baton rouge buy', forumId: '153' },
  { query: 'moving to louisiana', forumId: '84' },
  { query: 'buying a home louisiana', forumId: '84' },
];

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

export async function scanCityData(): Promise<CityDataLead[]> {
  const leads: CityDataLead[] = [];
  const seenUrls = new Set<string>();

  for (const search of SEARCHES) {
    try {
      const url = `https://www.city-data.com/forum/search.php?query=${encodeURIComponent(search.query)}&forumid=${search.forumId}&do=process`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.city-data.com/',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) continue;
      const html = await res.text();
      const posts = parseSearchResults(html);

      for (const post of posts) {
        if (seenUrls.has(post.url)) continue;
        seenUrls.add(post.url);

        const combined = `${post.title} ${post.body}`.toLowerCase();
        const { intentType, score } = scoreIntent(combined);

        if (score >= 3) {
          leads.push({ ...post, intentType, intentScore: score, source: 'city-data' });
        }
      }
    } catch (err) {
      console.error(`[City-Data] Failed for query "${search.query}":`, err);
    }
  }

  return leads.sort((a, b) => b.intentScore - a.intentScore);
}

interface RawPost {
  title: string;
  body: string;
  author: string;
  url: string;
  postedAt: string;
}

export function parseSearchResults(html: string): RawPost[] {
  const posts: RawPost[] = [];

  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Match full anchor tags linking to city-data forum threads
  const threadLinks = clean.matchAll(/<a[^>]+href="(https?:\/\/www\.city-data\.com\/forum\/[^"]+\.html[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of threadLinks) {
    const url = match[1].split('#')[0]; // strip fragment
    if (posts.some((p) => p.url === url)) continue;

    // Title is the anchor text
    const title = stripTags(match[2]).trim();
    if (!title || title.length < 10) continue;

    // Grab surrounding context for body
    const linkIndex = clean.indexOf(match[0]);
    const surrounding = clean.slice(Math.max(0, linkIndex - 100), linkIndex + 800);

    const body = stripTags(surrounding).replace(/\s+/g, ' ').trim().slice(0, 400);

    // Author
    const authorMatch = surrounding.match(/(?:by|posted by|author)[:\s]+([A-Za-z0-9_\-]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : 'Unknown';

    // Date
    const dateMatch = surrounding.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\w+ \d{1,2},?\s*\d{4})/);
    const postedAt = dateMatch ? (() => { try { return new Date(dateMatch[0]).toISOString(); } catch { return new Date().toISOString(); } })() : new Date().toISOString();

    posts.push({ title: title.slice(0, 200), body, author, url, postedAt });
  }

  return posts;
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
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '');
}
