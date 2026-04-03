/**
 * BiggerPockets Forum Monitor
 *
 * Scrapes public forum posts from biggerpockets.com for investor leads
 * in the Louisiana / Baton Rouge market.
 *
 * Target: real estate investors posting about buying deals, finding agents,
 * or asking about the local market. These are typically cash buyers or
 * serious buyers — high-value leads for Dynasty.
 *
 * BiggerPockets has a public forum with no auth required for reading.
 * Search URL: https://www.biggerpockets.com/forums/search?q=baton+rouge
 */

export interface BiggerPocketsLead {
  title: string;
  body: string;
  author: string;
  url: string;
  intentType: 'buyer' | 'seller' | 'investor' | 'unknown';
  intentScore: number; // 1–10
  postedAt: string;
  source: 'biggerpockets';
}

const SEARCH_QUERIES = [
  'baton rouge',
  'louisiana real estate',
  'new orleans investment',
  'baton rouge rental',
  'louisiana market',
];

const INVESTOR_KEYWORDS = [
  'looking to invest', 'want to invest', 'buying a rental', 'cash flow',
  'cap rate', 'deal analysis', 'buy and hold', 'brrrr', 'fix and flip',
  'multifamily', 'duplex', 'triplex', 'turnkey', 'wholesale',
  'need an agent', 'recommend an agent', 'local agent', 'boots on the ground',
  'property manager', 'out of state investor', 'passive income',
];

const BUYER_KEYWORDS = [
  'looking to buy', 'first property', 'house hack', 'primary residence',
  'moving to', 'relocating', 'single family', 'sfr',
];

const SELLER_KEYWORDS = [
  'selling', 'list my property', 'off market', 'motivated seller',
  'need to sell', 'exit strategy',
];

export async function scanBiggerPockets(): Promise<BiggerPocketsLead[]> {
  const leads: BiggerPocketsLead[] = [];
  const seenUrls = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    try {
      const url = `https://www.biggerpockets.com/forums/search?q=${encodeURIComponent(query)}&sort=recent`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) continue;
      const html = await res.text();
      const posts = parseForumPosts(html);

      for (const post of posts) {
        if (seenUrls.has(post.url)) continue;
        seenUrls.add(post.url);

        const combined = `${post.title} ${post.body}`.toLowerCase();
        const { intentType, score } = scoreIntent(combined);

        if (score >= 3) {
          leads.push({
            ...post,
            intentType,
            intentScore: score,
            source: 'biggerpockets',
          });
        }
      }
    } catch (err) {
      console.error(`[BiggerPockets] Failed for query "${query}":`, err);
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

export function parseForumPosts(html: string): RawPost[] {
  const posts: RawPost[] = [];

  // Strip scripts/styles
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // BiggerPockets forum search results use article or discussion-style blocks
  // Match post titles with links to /forums/thread/ or /topics/
  const threadLinks = clean.matchAll(/href="(\/forums\/[^"]*(?:thread|topic)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of threadLinks) {
    const path = match[1];
    const linkText = stripTags(match[2]).trim();
    if (!linkText || linkText.length < 10) continue;

    const url = `https://www.biggerpockets.com${path}`;

    // Try to extract surrounding context (body text near this link)
    const linkIndex = clean.indexOf(match[0]);
    const surrounding = clean.slice(Math.max(0, linkIndex - 200), linkIndex + 600);
    const body = stripTags(surrounding).replace(/\s+/g, ' ').trim().slice(0, 400);

    // Try to find author near the post
    const authorMatch = surrounding.match(/by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)|class="[^"]*author[^"]*"[^>]*>([^<]+)</i);
    const author = authorMatch ? (authorMatch[1] ?? authorMatch[2] ?? 'Unknown').trim() : 'Unknown';

    // Try to find a date
    const dateMatch = surrounding.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},?\s*\d{4})/);
    const postedAt = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString();

    if (!posts.some((p) => p.url === url)) {
      posts.push({ title: linkText.slice(0, 200), body, author, url, postedAt });
    }
  }

  return posts;
}

export function scoreIntent(text: string): { intentType: BiggerPocketsLead['intentType']; score: number } {
  let investorHits = 0;
  let buyerHits = 0;
  let sellerHits = 0;

  for (const kw of INVESTOR_KEYWORDS) if (text.includes(kw)) investorHits++;
  for (const kw of BUYER_KEYWORDS) if (text.includes(kw)) buyerHits++;
  for (const kw of SELLER_KEYWORDS) if (text.includes(kw)) sellerHits++;

  const intentType =
    investorHits > 0 ? 'investor' :
    buyerHits > 0 && sellerHits > 0 ? 'seller' :
    buyerHits > 0 ? 'buyer' :
    sellerHits > 0 ? 'seller' : 'unknown';

  const score = Math.min(10, investorHits * 2 + buyerHits * 2 + sellerHits * 1);
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
