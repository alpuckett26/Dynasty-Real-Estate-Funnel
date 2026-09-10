/**
 * Reddit Intent Monitor
 *
 * Watches public subreddits for posts that signal buying or selling intent.
 *
 * Ran anonymously against `.json` endpoints until 2026-08-15, when Reddit
 * started answering 403 from every IP. It now authenticates as a registered
 * app and reads oauth.reddit.com — see ./reddit-auth for the setup. The source
 * stays off until LEADGEN_ENABLE_REDDIT_MONITOR=true, and reports 'error'
 * rather than a silent zero if it is switched on without credentials.
 *
 * Intent signals found:
 * - "looking to buy a house in [city]"
 * - "moving to Baton Rouge"
 * - "selling my home" / "thinking of selling"
 * - "first time homebuyer"
 * - "need a real estate agent"
 */

import {
  classifyStatus,
  disabledScan,
  isSourceEnabled,
  summariseHealth,
  type SourceScan,
} from '../source-health';
import { RedditAuthError, getRedditAccessToken, redditApiFetch } from './reddit-auth';

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

/** Posts older than this are stale enough that someone else has them. */
const MAX_POST_AGE_HOURS = 48;

export async function scanRedditForLeads(): Promise<SourceScan<RedditLead>> {
  const source = 'reddit-monitor';
  if (!isSourceEnabled(source)) return disabledScan<RedditLead>(source);

  // Authenticate once up front. Failing here is a whole-source failure, and
  // saying so beats six identical per-subreddit errors.
  try {
    await getRedditAccessToken();
  } catch (err) {
    return authFailureScan(source, err);
  }

  const leads: RedditLead[] = [];
  let requests = 0;
  const failures = { blocked: 0, error: 0 };

  for (const subreddit of SUBREDDITS) {
    try {
      requests++;
      const res = await redditApiFetch(`/r/${subreddit}/new?limit=50&raw_json=1`);

      if (!res.ok) {
        failures[classifyStatus(res.status)]++;
        console.error(`[Reddit Monitor] r/${subreddit} returned HTTP ${res.status}`);
        // 429 is a quota wall, not a per-subreddit fault. Every remaining
        // request would spend the same exhausted quota and report the same
        // failure, so stop and let the summary reflect what was attempted.
        if (res.status === 429) {
          console.error('[Reddit Monitor] Rate limited — abandoning the rest of this scan');
          break;
        }
        continue;
      }

      const data = await res.json() as RedditAPIResponse;

      for (const post of data.data.children) {
        const p = post.data;

        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600;
        if (ageHours > MAX_POST_AGE_HOURS) continue;

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
      // A token that dies mid-scan surfaces here; still a whole-source failure.
      if (err instanceof RedditAuthError) return authFailureScan(source, err);
      failures.error++;
      console.error(`[Reddit Monitor] Failed for r/${subreddit}:`, err);
    }
  }

  // Sort by intent score descending
  leads.sort((a, b) => b.intentScore - a.intentScore);

  const { health, detail } = summariseHealth(requests, failures);
  return { source, health, detail, leads, requests, failures: failures.blocked + failures.error };
}

/**
 * Turn an auth failure into source health.
 *
 * Missing or wrong credentials are 'error', not 'blocked': nothing is refusing
 * us, the app just isn't configured, and the fix is in Vercel's env vars rather
 * than in finding a way around a bot wall.
 */
function authFailureScan(source: string, err: unknown): SourceScan<RedditLead> {
  const detail = err instanceof RedditAuthError
    ? `Reddit OAuth failed (${err.kind}): ${err.message}`
    : `Reddit OAuth failed: ${err instanceof Error ? err.message : String(err)}`;

  console.error(`[Reddit Monitor] ${detail}`);

  return { source, health: 'error', detail, leads: [], requests: 0, failures: 1 };
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
