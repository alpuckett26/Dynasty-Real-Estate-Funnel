/**
 * Cron: Outbound Lead Generation Bot
 *
 * Runs daily at 7am. Scans public sources for people expressing
 * buying or selling intent, creates HubSpot contacts, fires outreach.
 *
 * Active sources:
 * - Reddit intent signals (buyer/seller leads flagged for manual DM outreach)
 * - City-Data forum threads (relocation/buyer leads)
 * - Craigslist FSBO (seller leads — blocked by cloud IPs, use local script instead)
 *
 * Removed (blocked/broken):
 * - FSBO.com — migrated to React SPA, HTML scraping no longer works
 * - BiggerPockets — blocking all automated requests (403)
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeCraigslistFSBO } from '@/lib/lead-gen/sources/craigslist';
import { scanRedditForLeads } from '@/lib/lead-gen/sources/reddit';
import { scanCityData } from '@/lib/lead-gen/sources/city-data';
import { processCraigslistLeads, processRedditLeads, processCityDataLeads } from '@/lib/lead-gen/processor';
import { alertOwner } from '@/lib/sms/twilio';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = [];
  let totalCreated = 0;

  // ── Craigslist FSBO ─────────────────────────────────────────────────────────
  try {
    const clLeads = await scrapeCraigslistFSBO();
    const clResult = await processCraigslistLeads(clLeads);
    results.push(clResult);
    totalCreated += clResult.created;
    console.log(`[LeadGen] Craigslist: ${clLeads.length} found, ${clResult.created} new, ${clResult.skipped} dupes`);
  } catch (err) {
    console.error('[LeadGen] Craigslist failed:', err);
    results.push({ source: 'craigslist-fsbo', created: 0, skipped: 0, errors: 1 });
  }

  // ── City-Data Forum Monitor ─────────────────────────────────────────────────
  try {
    const cdLeads = await scanCityData();
    const cdResult = await processCityDataLeads(cdLeads);
    results.push(cdResult);
    totalCreated += cdResult.created;
    console.log(`[LeadGen] City-Data: ${cdLeads.length} signals, ${cdResult.created} prospects created`);
  } catch (err) {
    console.error('[LeadGen] City-Data failed:', err);
    results.push({ source: 'city-data', created: 0, skipped: 0, errors: 1 });
  }

  // ── Reddit Intent Monitor ───────────────────────────────────────────────────
  try {
    const redditLeads = await scanRedditForLeads();
    const redditResult = await processRedditLeads(redditLeads);
    results.push(redditResult);
    totalCreated += redditResult.created;
    console.log(`[LeadGen] Reddit: ${redditLeads.length} signals, ${redditResult.created} prospects created`);
  } catch (err) {
    console.error('[LeadGen] Reddit failed:', err);
    results.push({ source: 'reddit-monitor', created: 0, skipped: 0, errors: 1 });
  }

  // ── Daily summary SMS to Adreanne ──────────────────────────────────────────
  if (totalCreated > 0) {
    const summary = results
      .map((r) => `${r.source}: ${r.created} new, ${r.skipped} dupes`)
      .join('\n');
    await alertOwner(`📊 ATR Lead Gen — ${new Date().toLocaleDateString()}\n${totalCreated} new leads loaded to HubSpot:\n\n${summary}`).catch(console.error);
  }

  return NextResponse.json({ date: new Date().toISOString(), totalCreated, results });
}
