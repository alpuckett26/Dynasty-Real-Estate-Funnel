/**
 * FSBO.com Listing Monitor
 *
 * Scrapes public listing pages from fsbo.com for Louisiana markets.
 * Targets homeowners actively trying to sell without an agent —
 * prime candidates for Dynasty's listing services.
 *
 * No auth required. HTML-based scraping.
 * Rate limit: polite 2s delay between requests.
 */

export interface FsboComLead {
  title: string;
  description: string;
  url: string;
  phone?: string;
  email?: string;
  address?: string;
  price?: string;
  city?: string;
  state?: string;
  postedAt: string;
  source: 'fsbo-com';
}

// Louisiana ZIP codes / city slugs covered by fsbo.com search
const SEARCH_URLS = [
  'https://www.fsbo.com/search/?location=Baton+Rouge%2C+LA&radius=50',
  'https://www.fsbo.com/search/?location=New+Orleans%2C+LA&radius=50',
];

export async function scrapeFsboCom(): Promise<FsboComLead[]> {
  const leads: FsboComLead[] = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const listingUrls = await fetchListingUrls(searchUrl);

      for (const url of listingUrls.slice(0, 20)) {
        try {
          const lead = await fetchListingDetail(url);
          if (lead) leads.push(lead);
          await delay(2000); // polite crawl delay
        } catch (err) {
          console.error(`[FSBO.com] Detail failed for ${url}:`, err);
        }
      }
    } catch (err) {
      console.error(`[FSBO.com] Search failed for ${searchUrl}:`, err);
    }
  }

  return leads;
}

async function fetchListingUrls(searchUrl: string): Promise<string[]> {
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return [];
  const html = await res.text();
  return extractListingUrls(html);
}

export function extractListingUrls(html: string): string[] {
  const urls: string[] = [];

  // fsbo.com listing links follow pattern /listing/XXXXX/
  const matches = html.matchAll(/href="(\/listing\/[^"]+)"/g);
  for (const match of matches) {
    const path = match[1];
    if (!path.includes('?') && path.split('/').length >= 3) {
      const url = `https://www.fsbo.com${path}`;
      if (!urls.includes(url)) urls.push(url);
    }
  }

  return urls;
}

async function fetchListingDetail(url: string): Promise<FsboComLead | null> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return null;
  const html = await res.text();
  return parseListingPage(html, url);
}

export function parseListingPage(html: string, url: string): FsboComLead | null {
  // Strip script/style blocks before parsing text
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Title
  const titleMatch = clean.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).trim() : '';

  // Price — look for dollar amounts
  const priceMatch = clean.match(/\$([\d,]+(?:,\d{3})*)/);
  const price = priceMatch ? `$${priceMatch[1]}` : undefined;

  // Address — fsbo.com typically shows address in the listing header
  const addressMatch = clean.match(/class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
  const address = addressMatch ? stripTags(addressMatch[1]).trim() : undefined;

  // Phone — US phone pattern
  const phoneMatch = clean.match(/\b(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})\b/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\D/g, '') : undefined;

  // Email
  const emailMatch = clean.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Description — grab largest block of visible text
  const descMatch = clean.match(/class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|p)>/i);
  const description = descMatch
    ? stripTags(descMatch[1]).replace(/\s+/g, ' ').trim().slice(0, 500)
    : '';

  // City/state from URL or page
  const cityMatch = url.match(/\/([a-z-]+)\/?(?:\d+)?\/?\s*$/i) || clean.match(/,\s*(LA|Louisiana)/i);
  const city = cityMatch ? cityMatch[1] : undefined;

  // Must have phone or email to be actionable
  if (!phone && !email) return null;

  return {
    title: title || 'FSBO Listing',
    description,
    url,
    phone,
    email,
    address,
    price,
    city,
    state: 'LA',
    postedAt: new Date().toISOString(),
    source: 'fsbo-com',
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
