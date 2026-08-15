/**
 * Craigslist FSBO Monitor
 *
 * Reads public RSS feeds for "for sale by owner" real estate listings
 * in configured markets. Extracts contact info and loads into HubSpot.
 *
 * Targets: sellers who are trying to sell without an agent — prime candidates
 * for Dynasty's listing services.
 *
 * DISABLED as of 2026-08-15 — the RSS feed returns HTTP 403 from residential
 * IPs as well as cloud ones, so the "run it locally instead" workaround that
 * used to be documented no longer works either. REDX (src/lib/lead-gen/sources/redx.ts)
 * now covers FSBO seller data, with contact details and consent handling.
 *
 * RSS format: https://{city}.craigslist.org/search/reo?format=rss
 * reo = real estate by owner, rea = all real estate
 */

import {
  classifyStatus,
  disabledScan,
  isSourceEnabled,
  summariseHealth,
  type SourceScan,
} from '../source-health';

export interface CraigslistLead {
  title: string;
  description: string;
  url: string;
  phone?: string;
  email?: string;
  address?: string;
  price?: string;
  postedAt: string;
  source: 'craigslist-fsbo';
}

// Target markets — add/remove cities as needed
const MARKETS = [
  { city: 'batonrouge', label: 'Baton Rouge' },
  { city: 'neworleans', label: 'New Orleans' },
];

export async function scrapeCraigslistFSBO(): Promise<SourceScan<CraigslistLead>> {
  const source = 'craigslist-fsbo';
  if (!isSourceEnabled(source)) return disabledScan<CraigslistLead>(source);

  const leads: CraigslistLead[] = [];
  let requests = 0;
  const failures = { blocked: 0, error: 0 };

  for (const market of MARKETS) {
    try {
      const url = `https://${market.city}.craigslist.org/search/reo?format=rss`;
      requests++;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DynastyRE/1.0)' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        failures[classifyStatus(res.status)]++;
        console.error(`[CL Scraper] ${market.city} returned HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseRSSItems(xml);

      for (const item of items) {
        const lead = extractLeadFromItem(item);
        if (lead) leads.push(lead);
      }
    } catch (err) {
      failures.error++;
      console.error(`[CL Scraper] Failed for ${market.city}:`, err);
    }
  }

  const { health, detail } = summariseHealth(requests, failures);
  return { source, health, detail, leads, requests, failures: failures.blocked + failures.error };
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const block = match[1];
    const title = extractTag(block, 'title') ?? '';
    const description = extractTag(block, 'description') ?? '';
    const link = extractTag(block, 'link') ?? '';
    const pubDate = extractTag(block, 'pubDate') ?? '';
    if (title && link) items.push({ title, description, link, pubDate });
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<\\!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function extractLeadFromItem(item: RSSItem): CraigslistLead | null {
  const combined = `${item.title} ${item.description}`;

  // Extract phone number
  const phoneMatch = combined.match(/\b(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})\b/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '') : undefined;

  // Extract email
  const emailMatch = combined.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Extract price
  const priceMatch = combined.match(/\$[\d,]+(?:k)?/i);
  const price = priceMatch ? priceMatch[0] : undefined;

  // Must have at least a phone or email to be useful
  if (!phone && !email) return null;

  // Strip HTML from description
  const description = item.description.replace(/<[^>]+>/g, '').trim().slice(0, 500);

  return {
    title: item.title.slice(0, 200),
    description,
    url: item.link,
    phone,
    email,
    price,
    postedAt: item.pubDate || new Date().toISOString(),
    source: 'craigslist-fsbo',
  };
}
