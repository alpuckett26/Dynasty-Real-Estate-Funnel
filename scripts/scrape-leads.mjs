/**
 * Dynasty / ATR Local Lead Gen Scraper
 *
 * Run manually: node scripts/scrape-leads.mjs
 * Schedule:     Windows Task Scheduler or cron
 *
 * Scrapes Craigslist, FSBO.com, BiggerPockets, City-Data, Reddit
 * from your local IP (bypasses cloud IP blocks), then POSTs
 * results to the Vercel API which loads them into HubSpot.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env.local ───────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn('No .env.local found — using existing environment');
}

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_PORTAL = process.env.HUBSPOT_PORTAL_ID;
const OWNER_PHONE = process.env.OWNER_PHONE;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;
const CALENDLY = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://adreannetherealtor.com/book';

if (!HUBSPOT_TOKEN) {
  console.error('❌ HUBSPOT_ACCESS_TOKEN not set in .env.local');
  process.exit(1);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const seenUrls = new Set();

// ── HubSpot helpers ───────────────────────────────────────────────────────────

async function findContact(email, phone) {
  const filters = [];
  if (email) filters.push({ propertyName: 'email', operator: 'EQ', value: email });
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    filters.push({ propertyName: 'phone', operator: 'EQ', value: digits });
  }
  if (!filters.length) return null;

  for (const filter of filters) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filterGroups: [{ filters: [filter] }], limit: 1 }),
    });
    const data = await res.json();
    if (data.results?.length) return data.results[0].id;
  }
  return null;
}

async function createContact(props) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: props }),
  });
  const data = await res.json();
  if (data.status === 'error') throw new Error(data.message);
  return data.id;
}

async function createNote(contactId, body) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { hs_note_body: body, hs_timestamp: String(Date.now()) },
      associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
    }),
  });
  return res.ok;
}

// ── Twilio SMS ────────────────────────────────────────────────────────────────

async function sendSMS(to, body) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return;
  const digits = to.replace(/\D/g, '');
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const creds = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: body }),
  });
}

// ── Lead processor ────────────────────────────────────────────────────────────

async function processLead({ firstName, lastName, email, phone, source, title, price, url, description, intentType }) {
  const existing = await findContact(email, phone);
  if (existing) return 'dupe';

  const contactId = await createContact({
    firstname: firstName,
    lastname: lastName,
    email: email || undefined,
    phone: phone || undefined,
    lead_type: intentType === 'seller' ? 'Seller' : 'Buyer',
    channel_source: 'form',
    lead_route: 'Warm',
    last_meaningful_interaction: new Date().toISOString(),
  });

  await createNote(contactId, [
    `[${(source ?? 'UNKNOWN').toUpperCase()} LEAD — ${new Date().toLocaleDateString()}]`,
    title ? `Title: ${title}` : '',
    price ? `Asking: ${price}` : '',
    url ? `URL: ${url}` : '',
    description ? `\n${description}` : '',
  ].filter(Boolean).join('\n'));

  // Outreach SMS
  if (phone && (source?.includes('fsbo') || source?.includes('craigslist'))) {
    const msg = `Hi! I'm Adreanne, a local real estate agent. I saw your listing and wanted to reach out — many FSBO sellers net more working with an agent. Free to chat? ${CALENDLY}`;
    await sendSMS(phone, msg).catch(() => {});
  }

  return 'created';
}

// ── Reddit ────────────────────────────────────────────────────────────────────

const BUYER_KW = ['looking to buy', 'want to buy', 'buying a house', 'buying a home', 'first time homebuyer', 'moving to baton rouge', 'relocating to', 'need a realtor', 'need an agent', 'pre-approval', 'fha loan'];
const SELLER_KW = ['selling my home', 'selling my house', 'want to sell', 'fsbo', 'for sale by owner', 'how much is my home worth', 'need to sell'];

async function scrapeReddit() {
  const subreddits = ['batonrouge', 'Louisiana', 'FirstTimeHomeBuyer', 'RealEstate', 'moving'];
  const leads = [];

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=50`, {
        headers: { 'User-Agent': 'ATR-LeadGen/1.0 (local script)' },
      });
      if (!res.ok) continue;
      const data = await res.json();

      for (const post of data.data.children) {
        const p = post.data;
        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600;
        if (ageHours > 48) continue;

        const text = `${p.title} ${p.selftext ?? ''}`.toLowerCase();
        const buyerHits = BUYER_KW.filter(kw => text.includes(kw)).length;
        const sellerHits = SELLER_KW.filter(kw => text.includes(kw)).length;
        const score = buyerHits * 2 + sellerHits * 2;
        if (score < 2) continue;

        leads.push({
          subreddit: sub,
          title: p.title.slice(0, 200),
          author: p.author,
          url: `https://reddit.com${p.permalink}`,
          score,
          intentType: sellerHits > 0 ? 'seller' : 'buyer',
          source: 'reddit-monitor',
        });
      }
    } catch (e) {
      console.warn(`  Reddit r/${sub} failed:`, e.message);
    }
  }

  return leads.sort((a, b) => b.score - a.score);
}

// ── Craigslist FSBO ───────────────────────────────────────────────────────────

async function scrapeCraigslist() {
  const markets = ['batonrouge', 'neworleans'];
  const leads = [];

  for (const market of markets) {
    try {
      const res = await fetch(`https://${market}.craigslist.org/search/reo?format=rss`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (!res.ok) { console.warn(`  CL ${market}: HTTP ${res.status}`); continue; }
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

      for (const item of items) {
        const block = item[1];
        const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)/)?.[1]?.trim() ?? '';
        const link = block.match(/<link>([^<]+)/)?.[1]?.trim() ?? '';
        const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.replace(/<[^>]+>/g, '').trim().slice(0, 300) ?? '';
        const combined = `${title} ${desc}`;

        const phone = combined.match(/\b(\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4})\b/)?.[1]?.replace(/\D/g, '');
        const email = combined.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/)?.[0];
        const price = combined.match(/\$[\d,]+/)?.[0];

        if (!phone && !email) continue;
        if (seenUrls.has(link)) continue;
        seenUrls.add(link);

        leads.push({ title, description: desc, url: link, phone, email, price, source: 'craigslist-fsbo' });
      }
    } catch (e) {
      console.warn(`  CL ${market} failed:`, e.message);
    }
  }

  return leads;
}

// FSBO.com removed — migrated to React SPA, HTML scraping no longer returns listings
// BiggerPockets removed — blocking all automated requests (403)

// ── City-Data ─────────────────────────────────────────────────────────────────

async function scrapeCityData() {
  const leads = [];
  const searches = [
    { query: 'moving to baton rouge', forumId: '153' },
    { query: 'buying a home baton rouge', forumId: '153' },
    { query: 'relocating to louisiana', forumId: '84' },
  ];

  for (const s of searches) {
    try {
      const res = await fetch(`https://www.city-data.com/forum/search.php?query=${encodeURIComponent(s.query)}&forumid=${s.forumId}&do=process`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/html', Referer: 'https://www.city-data.com/' },
      });
      if (!res.ok) { console.warn(`  City-Data HTTP ${res.status}`); continue; }
      const html = await res.text();
      const threads = [...html.matchAll(/<a[^>]+href="(https?:\/\/www\.city-data\.com\/forum\/[^"]+\.html[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
        .map(m => ({ url: m[1].split('#')[0], title: m[2].replace(/<[^>]+>/g, '').trim() }))
        .filter(t => t.title.length > 10 && !seenUrls.has(t.url));

      for (const t of threads.slice(0, 5)) {
        seenUrls.add(t.url);
        leads.push({ ...t, source: 'city-data', intentType: 'buyer' });
      }
    } catch (e) {
      console.warn(`  City-Data failed:`, e.message);
    }
  }

  return leads;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏠 ATR Lead Gen Scraper — ' + new Date().toLocaleString());
  console.log('━'.repeat(50));

  const summary = { craigslist: 0, city_data: 0, reddit: 0, total: 0, dupes: 0, errors: 0 };

  // ── Craigslist ──────────────────────────────────────────────────────────
  console.log('\n📋 Craigslist FSBO...');
  const clLeads = await scrapeCraigslist();
  console.log(`  Found ${clLeads.length} listings with contact info`);
  for (const lead of clLeads) {
    try {
      const result = await processLead({ firstName: 'FSBO', lastName: 'Seller', ...lead });
      if (result === 'created') { summary.craigslist++; summary.total++; console.log(`  ✅ New: ${lead.title.slice(0, 60)}`); }
      else { summary.dupes++; console.log(`  ⏭  Dupe: ${lead.title.slice(0, 60)}`); }
    } catch (e) { summary.errors++; console.warn(`  ❌ Error:`, e.message); }
  }

  // ── City-Data ───────────────────────────────────────────────────────────
  console.log('\n🏘  City-Data...');
  const cdLeads = await scrapeCityData();
  console.log(`  Found ${cdLeads.length} relevant threads`);
  for (const lead of cdLeads) {
    try {
      const result = await processLead({ firstName: 'CD', lastName: 'Prospect', email: undefined, phone: undefined, ...lead });
      if (result === 'created') { summary.city_data++; summary.total++; console.log(`  ✅ New: ${lead.title.slice(0, 60)}`); }
      else { summary.dupes++; }
    } catch (e) { summary.errors++; }
  }

  // ── Reddit ──────────────────────────────────────────────────────────────
  console.log('\n📡 Reddit...');
  const redditLeads = await scrapeReddit();
  console.log(`  Found ${redditLeads.length} high-intent posts`);
  for (const lead of redditLeads.slice(0, 10)) {
    try {
      const result = await processLead({ firstName: `Reddit: u/${lead.author}`, lastName: `(${lead.subreddit})`, email: undefined, phone: undefined, ...lead });
      if (result === 'created') { summary.reddit++; summary.total++; console.log(`  ✅ New: ${lead.title.slice(0, 60)}`); }
      else { summary.dupes++; }
    } catch (e) { summary.errors++; }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary:');
  console.log(`  Craigslist:    ${summary.craigslist} new`);
  console.log(`  City-Data:     ${summary.city_data} new`);
  console.log(`  Reddit:        ${summary.reddit} new`);
  console.log(`  Total new:     ${summary.total}`);
  console.log(`  Dupes skipped: ${summary.dupes}`);
  console.log(`  Errors:        ${summary.errors}`);

  // ── SMS summary to Adreanne ─────────────────────────────────────────────
  if (summary.total > 0 && OWNER_PHONE) {
    const msg = `📊 ATR Lead Gen — ${new Date().toLocaleDateString()}\n${summary.total} new leads loaded:\nCraigslist: ${summary.craigslist} | City-Data: ${summary.city_data} | Reddit: ${summary.reddit}`;
    await sendSMS(OWNER_PHONE, msg).catch(() => {});
    console.log('\n📱 SMS summary sent to Adreanne');
  }

  console.log('\n✅ Done — check dashboard at https://dynasty-real-estate-funnel.vercel.app/dashboard\n');
}

main().catch(console.error);
