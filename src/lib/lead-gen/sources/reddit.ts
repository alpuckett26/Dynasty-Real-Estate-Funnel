/**
 * Reddit Intent Monitor
 *
 * Watches public subreddits for posts/comments that signal buying or selling intent.
 * Uses Reddit's public JSON API — no credentials required.
 *
 * Intent signals found:
 * - "looking to buy a house in [city]"
 * - "moving to Baton Rouge"
 * - "selling my home" / "thinking of selling"
 * - "first time homebuyer"
 * - "need a real estate agent"
 */

export interface RedditLead {
  subreddit: string;
  title: string;
  body: string;
  author: string;
  url: string;
  intentType: 'buyer' | 'seller' | 'both' | 'unknown';
  intentScore: number; // 1–10
  postedAt: string;
  source: 'reddit-monitor';
}

const SUBREDDITS = [
  'batonrouge',
  'Louisiana',
  'FirstTimeHomeBuyer',
  'RealEstate',
  'moving',
  'personalfinance',
];

const BUYER_KEYWORDS = [
  'looking to buy', 'want to buy', 'buying a house', 'buying a home',
  'first time homebuyer', 'first time buyer', 'pre-approval', 'pre approval',
  'moving to baton rouge', 'relocating to', 'moving from', 'searching for a home',
  'need a realtor', 'need an agent', 'recommend a real estate agent',
  'down payment assistance', 'fha loan', 'va loan',
];

const SELLER_KEYWORDS = [
  'selling my home', 'selling my house', 'want to sell', 'thinking of selling',
  'list my home', 'for sale by owner', 'fsbo', 'how much is my home worth',
  'home valuation', 'need to sell fast', 'cash offer',
];

export async function scanRedditForLeads(): Promise<RedditLead[]> {
  const leads: RedditLead[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      // Search new posts in the last 24 hours
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DynastyRealEstate/1.0 (lead gen monitor)' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) continue;
      const data = await res.json() as RedditAPIResponse;

      for (const post of data.data.children) {
        const p = post.data;

        // Only look at posts from last 48 hours
        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600;
        if (ageHours > 48) continue;

        const combined = `${p.title} ${p.selftext ?? ''}`.toLowerCase();
        const { intentType, score } = scoreIntent(combined);

        if (score >= 3) {
          leads.push({
            subreddit,
            title: p.title.slice(0, 200),
            body: (p.selftext ?? '').slice(0, 500),
            author: p.author,
            url: `https://reddit.com${p.permalink}`,
            intentType,
            intentScore: score,
            postedAt: new Date(p.created_utc * 1000).toISOString(),
            source: 'reddit-monitor',
          });
        }
      }
    } catch (err) {
      console.error(`[Reddit Monitor] Failed for r/${subreddit}:`, err);
    }
  }

  // Sort by intent score descending
  return leads.sort((a, b) => b.intentScore - a.intentScore);
}

function scoreIntent(text: string): { intentType: RedditLead['intentType']; score: number } {
  let buyerHits = 0;
  let sellerHits = 0;

  for (const kw of BUYER_KEYWORDS) {
    if (text.includes(kw)) buyerHits++;
  }
  for (const kw of SELLER_KEYWORDS) {
    if (text.includes(kw)) sellerHits++;
  }

  const intentType =
    buyerHits > 0 && sellerHits > 0 ? 'both' :
    buyerHits > 0 ? 'buyer' :
    sellerHits > 0 ? 'seller' : 'unknown';

  const score = Math.min(10, buyerHits * 2 + sellerHits * 2);

  return { intentType, score };
}

interface RedditAPIResponse {
  data: {
    children: Array<{
      data: {
        title: string;
        selftext?: string;
        author: string;
        permalink: string;
        created_utc: number;
        subreddit: string;
      };
    }>;
  };
}
