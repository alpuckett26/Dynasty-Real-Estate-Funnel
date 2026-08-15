/**
 * Diagnostic endpoint — probes each lead-gen source and reports whether the
 * site is reachable. No HubSpot contacts are created.
 *
 * This is the tool for answering "has Reddit/Craigslist/City-Data reopened?",
 * so it reports the raw HTTP status rather than a verdict. It previously
 * returned `status: 'ok'` whenever a request did not throw — which meant a
 * source returning 403, or returning a page the parser could not read, both
 * reported healthy with zero results. That is the failure mode this endpoint
 * exists to catch, so `ok` now requires a 2xx *and* parsed rows.
 *
 * Protected with the cron secret: it makes the deployment issue outbound
 * requests, so it should not be anonymously triggerable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/utils/cron-auth';
import { parseSearchResults } from '@/lib/lead-gen/sources/city-data';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ProbeResult {
  status: 'ok' | 'blocked' | 'error' | 'unparseable';
  httpStatus?: number;
  found?: number;
  note?: string;
  sample?: unknown[];
  error?: string;
}

/**
 * Probe one source. `parse` returns the rows found; an empty result on a 2xx
 * means the site answered but the parser could not read it — reported as
 * `unparseable` rather than a healthy zero, because they need different fixes.
 */
async function probe(
  url: string,
  headers: Record<string, string>,
  parse: (body: string) => unknown[],
  note?: string
): Promise<ProbeResult> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });

    if (!res.ok) {
      const blocked = res.status === 403 || res.status === 429 || res.status === 401;
      return {
        status: blocked ? 'blocked' : 'error',
        httpStatus: res.status,
        note: blocked ? 'Site is refusing automated requests' : note,
      };
    }

    const rows = parse(await res.text());
    if (rows.length === 0) {
      return {
        status: 'unparseable',
        httpStatus: res.status,
        found: 0,
        note: note ?? 'Reachable but nothing parsed — the page layout likely changed',
      };
    }

    return { status: 'ok', httpStatus: res.status, found: rows.length, note, sample: rows.slice(0, 5) };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, ProbeResult> = {};

  results.reddit = await probe(
    'https://www.reddit.com/r/batonrouge/new.json?limit=25',
    { 'User-Agent': 'DynastyRealEstate/1.0' },
    (body) => {
      const data = JSON.parse(body) as {
        data: { children: Array<{ data: { title: string; author: string; permalink: string } }> };
      };
      return data.data.children.map((p) => ({
        title: p.data.title,
        author: p.data.author,
        url: `https://reddit.com${p.data.permalink}`,
      }));
    },
    'Anonymous JSON access was closed in 2026; expect 403 until an OAuth app is registered'
  );

  results.craigslist = await probe(
    'https://batonrouge.craigslist.org/search/reo?format=rss',
    { 'User-Agent': BROWSER_UA },
    (xml) =>
      [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5).map((m) => ({
        title: m[1].match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)/)?.[1]?.trim() ?? '',
        link: m[1].match(/<link>([^<]+)/)?.[1]?.trim() ?? '',
      })),
    'Blocked from cloud and residential IPs alike'
  );

  results.city_data = await probe(
    'https://www.city-data.com/forum/search.php?query=baton+rouge&forumid=153&do=process',
    { 'User-Agent': BROWSER_UA, Accept: 'text/html', Referer: 'https://www.city-data.com/' },
    (html) =>
      parseSearchResults(html).slice(0, 5).map((p) => ({
        title: p.title,
        forum: p.forum,
        author: p.author,
        postedAt: p.postedAt,
        url: p.url,
      })),
    'Reachable, but the forum filter is ignored server-side — results are national ' +
      'and often years old, so a healthy probe here still does not mean usable leads'
  );

  const usable = Object.values(results).filter((r) => r.status === 'ok').length;

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      summary: `${usable}/${Object.keys(results).length} sources reachable and parseable`,
      results,
    },
    { status: 200 }
  );
}
