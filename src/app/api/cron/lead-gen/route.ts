/**
 * Cron: Outbound Lead Generation Bot
 *
 * Runs daily at 7am Central. Scans public sources for people expressing
 * buying or selling intent, creates HubSpot contacts, fires outreach.
 *
 * All three scraper sources are currently DISABLED — see
 * src/lib/lead-gen/source-health.ts for the per-source evidence. Purchased
 * lists (REDX, via /api/lead-gen/import) are the working seller-lead path.
 *
 * This route still runs daily so that:
 * - a re-enabled source is exercised and reported on, and
 * - if a source is blocked, that is ALERTED rather than logged as success.
 *
 * Sources:
 * - Reddit intent signals    disabled — HTTP 403, needs OAuth
 * - City-Data forum threads  disabled — forum filter ignored server-side
 * - Craigslist FSBO          disabled — HTTP 403 from cloud and home IPs
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
import { needsAttention, type SourceScan } from '@/lib/lead-gen/source-health';
import { alertOwner } from '@/lib/sms/twilio';
import { isAuthorizedCron } from '@/lib/utils/cron-auth';
import type { ProcessResult } from '@/lib/lead-gen/processor';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface SourceOutcome extends ProcessResult {
  health: SourceScan<unknown>['health'];
  detail: string;
  found: number;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: SourceOutcome[] = [];
  let totalCreated = 0;

  /**
   * Run one source and fold its scan health together with its processing
   * result, so a source that fetched nothing is distinguishable from one that
   * was refused. A thrown scan is itself an error worth surfacing.
   */
  async function run<T>(
    label: string,
    scan: () => Promise<SourceScan<T>>,
    process: (leads: T[]) => Promise<ProcessResult>
  ): Promise<void> {
    try {
      const result = await scan();
      const processed = result.leads.length
        ? await process(result.leads)
        : { source: result.source, created: 0, skipped: 0, errors: 0 };

      results.push({
        ...processed,
        health: result.health,
        detail: result.detail,
        found: result.leads.length,
      });
      totalCreated += processed.created;

      console.log(
        `[LeadGen] ${label}: ${result.health} — ${result.leads.length} found, ` +
        `${processed.created} new, ${processed.skipped} dupes (${result.detail})`
      );
    } catch (err) {
      console.error(`[LeadGen] ${label} threw:`, err);
      results.push({
        source: label,
        created: 0,
        skipped: 0,
        errors: 1,
        health: 'error',
        detail: err instanceof Error ? err.message : String(err),
        found: 0,
      });
    }
  }

  await run('craigslist-fsbo', scrapeCraigslistFSBO, processCraigslistLeads);
  await run('city-data', scanCityData, processCityDataLeads);
  await run('reddit-monitor', scanRedditForLeads, processRedditLeads);

  // ── Daily summary SMS to Adreanne ──────────────────────────────────────────
  if (totalCreated > 0) {
    const summary = results
      .filter((r) => r.created > 0 || r.skipped > 0)
      .map((r) => `${r.source}: ${r.created} new, ${r.skipped} dupes`)
      .join('\n');
    await alertOwner(
      `📊 ATR Lead Gen — ${new Date().toLocaleDateString()}\n` +
      `${totalCreated} new leads loaded to HubSpot:\n\n${summary}`
    ).catch(console.error);
  }

  // ── Health alert ───────────────────────────────────────────────────────────
  // A blocked source produces zero leads and looks exactly like a quiet day.
  // This is the only thing that tells anyone the pipeline has stopped working.
  // Disabled sources are intentional and stay silent.
  const broken = results.filter((r) => needsAttention({ health: r.health } as SourceScan<unknown>));
  if (broken.length > 0) {
    const lines = broken.map((r) => `• ${r.source} — ${r.health}: ${r.detail}`);
    await alertOwner(
      `⚠️ ATR Lead Gen — ${broken.length} source${broken.length > 1 ? 's' : ''} not working\n\n` +
      `${lines.join('\n')}\n\n` +
      `No leads are coming from ${broken.length > 1 ? 'these' : 'this'} today.`
    ).catch(console.error);
  }

  return NextResponse.json({
    date: new Date().toISOString(),
    totalCreated,
    healthy: broken.length === 0,
    results,
  });
}
