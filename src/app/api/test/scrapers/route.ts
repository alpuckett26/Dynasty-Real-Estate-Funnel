/**
 * Test endpoint — runs all lead gen scrapers with relaxed filters
 * and returns raw results. No HubSpot contacts created.
 * Remove or protect this endpoint before going fully public.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET() {
  const results: Record<string, unknown> = {};

  // ── Reddit ────────────────────────────────────────────────────────────────
  try {
    const subreddits = ['batonrouge', 'Louisiana', 'FirstTimeHomeBuyer'];
    const redditPosts: unknown[] = [];

    for (const sub of subreddits) {
      const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=25`, {
        headers: { 'User-Agent': 'DynastyRealEstate/1.0' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const data = await res.json() as { data: { children: Array<{ data: { title: string; author: string; created_utc: number; permalink: string } }> } };
      const posts = data.data.children.slice(0, 5).map(p => ({
        subreddit: sub,
        title: p.data.title,
        author: p.data.author,
        age: Math.round((Date.now() / 1000 - p.data.created_utc) / 3600) + 'h ago',
        url: `https://reddit.com${p.data.permalink}`,
      }));
      redditPosts.push(...posts);
    }
    results.reddit = { status: 'ok', count: redditPosts.length, sample: redditPosts.slice(0, 5) };
  } catch (err) {
    results.reddit = { status: 'error', error: String(err) };
  }

  // ── Craigslist ────────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://batonrouge.craigslist.org/search/reo?format=rss', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    const parsed = items.map(m => {
      const title = m[1].match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)/)?.[1]?.trim() ?? '';
      const link = m[1].match(/<link>([^<]+)/)?.[1]?.trim() ?? '';
      return { title, link };
    });
    results.craigslist = { status: 'ok', count: items.length, sample: parsed };
  } catch (err) {
    results.craigslist = { status: 'error', error: String(err) };
  }

  // ── FSBO.com ──────────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://www.fsbo.com/search/?location=Baton+Rouge%2C+LA&radius=50', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const links = [...html.matchAll(/href="(\/listing\/[^"]+)"/g)]
      .map(m => `https://www.fsbo.com${m[1]}`)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);
    results.fsbo_com = { status: 'ok', listingsFound: links.length, sample: links };
  } catch (err) {
    results.fsbo_com = { status: 'error', error: String(err) };
  }

  // ── BiggerPockets ─────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://www.biggerpockets.com/forums/search?q=baton+rouge&sort=recent', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const threads = [...html.matchAll(/<a[^>]+href="(\/forums\/[^"]*(?:thread|topic)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => ({ url: `https://www.biggerpockets.com${m[1]}`, title: m[2].replace(/<[^>]+>/g, '').trim() }))
      .filter(t => t.title.length > 10)
      .slice(0, 5);
    results.biggerpockets = { status: 'ok', threadsFound: threads.length, sample: threads };
  } catch (err) {
    results.biggerpockets = { status: 'error', error: String(err) };
  }

  // ── City-Data ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://www.city-data.com/forum/search.php?query=baton+rouge&forumid=153&do=process', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Referer': 'https://www.city-data.com/',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const threads = [...html.matchAll(/<a[^>]+href="(https?:\/\/www\.city-data\.com\/forum\/[^"]+\.html[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => ({ url: m[1].split('#')[0], title: m[2].replace(/<[^>]+>/g, '').trim() }))
      .filter(t => t.title.length > 10)
      .slice(0, 5);
    results.city_data = { status: 'ok', threadsFound: threads.length, sample: threads };
  } catch (err) {
    results.city_data = { status: 'error', error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
