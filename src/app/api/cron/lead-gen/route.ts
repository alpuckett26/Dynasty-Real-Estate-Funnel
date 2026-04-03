/**
 * Cron: Outbound Lead Generation Bot
 *
 * Runs daily at 7am. Scans public sources for people expressing
 * buying or selling intent, creates HubSpot contacts, fires outreach.
 *
 * Sources:
 * - Craigslist FSBO (seller leads with phone/email)
 * - FSBO.com (seller leads — more volume, more serious sellers)
 * - Reddit intent signals (buyer/seller leads flagged for manual DM outreach)
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeCraigslistFSBO } from '@/lib/lead-gen/sources/craigslist';
import { scrapeFsboCom } from '@/lib/lead-gen/sources/fsbo-com';
import { scanRedditForLeads } from '@/lib/lead-gen/sources/reddit';
import { processCraigslistLeads, processFsboComLeads, processRedditLeads } from '@/lib/lead-gen/processor';
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

  // ── FSBO.com ────────────────────────────────────────────────────────────────
  try {
    const fsboLeads = await scrapeFsboCom();
    const fsboResult = await processFsboComLeads(fsboLeads);
    results.push(fsboResult);
    totalCreated += fsboResult.created;
    console.log(`[LeadGen] FSBO.com: ${fsboLeads.length} found, ${fsboResult.created} new, ${fsboResult.skipped} dupes`);
  } catch (err) {
    console.error('[LeadGen] FSBO.com failed:', err);
    results.push({ source: 'fsbo-com', created: 0, skipped: 0, errors: 1 });
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
    await alertOwner(`📊 Dynasty Lead Gen — ${new Date().toLocaleDateString()}\n${totalCreated} new leads loaded to HubSpot:\n\n${summary}`).catch(console.error);
  }

  return NextResponse.json({ date: new Date().toISOString(), totalCreated, results });
}
