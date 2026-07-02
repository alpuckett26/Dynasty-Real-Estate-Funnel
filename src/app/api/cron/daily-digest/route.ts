/**
 * Cron: Daily Lead Digest
 *
 * Runs every evening. Pulls all contacts created in HubSpot in the last
 * 24 hours (from EVERY source — forms, chat, Meta ads, ManyChat, open
 * houses, scrapers) and sends Adreanne a digest via email + SMS + Slack.
 *
 * Fires even on a zero-lead day — the client should see the funnel's
 * pulse daily, and a zero day is a signal to check traffic sources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchContactsCreatedSince, type RecentContact } from '@/lib/hubspot/client';
import { sendEmail } from '@/lib/email/resend';
import { alertOwner } from '@/lib/sms/twilio';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let contacts: RecentContact[];
  try {
    contacts = await searchContactsCreatedSince(Date.now() - DAY_MS);
  } catch (err) {
    console.error('[DailyDigest] HubSpot search failed:', err);
    return NextResponse.json({ error: 'HubSpot search failed' }, { status: 500 });
  }

  const total = contacts.length;
  const hot = contacts.filter((c) => c.lead_route?.toLowerCase() === 'hot');
  const warm = contacts.filter((c) => c.lead_route?.toLowerCase() === 'warm');
  const cold = contacts.filter((c) => c.lead_route?.toLowerCase() === 'cold');

  const bySource = new Map<string, number>();
  for (const c of contacts) {
    const src = c.channel_source || 'unknown';
    bySource.set(src, (bySource.get(src) ?? 0) + 1);
  }
  const sourceLines = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([src, n]) => `  • ${src}: ${n}`)
    .join('\n');

  const dateLabel = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric',
  });

  const hotList = hot
    .map((c) => `  🔥 ${name(c)} — ${c.phone || c.email || 'no contact info'} (score ${c.total_lead_score ?? '?'})`)
    .join('\n');

  // ── Email digest ──────────────────────────────────────────────────────────
  const emailBody = [
    `Daily Lead Digest — ${dateLabel}`,
    '',
    `New leads (last 24h): ${total}`,
    `  Hot: ${hot.length}  |  Warm: ${warm.length}  |  Cold: ${cold.length}`,
    '',
    total > 0 ? `By source:\n${sourceLines}` : 'No new leads today — check that ads are running and forms/chat are live.',
    hot.length > 0 ? `\nHot leads to call NOW:\n${hotList}` : '',
    '',
    total > 0
      ? [...contacts].slice(0, 25).map((c) =>
          `— ${name(c)} [${(c.lead_route ?? '?').toUpperCase()}] via ${c.channel_source ?? '?'} · ${c.phone || c.email || ''}`
        ).join('\n')
      : '',
    total > 25 ? `…and ${total - 25} more in HubSpot.` : '',
    '',
    'Full details: HubSpot → Contacts → sorted by Create Date.',
    '— Dynasty AI Funnel',
  ].filter(Boolean).join('\n');

  const digestEmail = process.env.DIGEST_EMAIL ?? process.env.REPLY_TO_EMAIL;
  const sends: Record<string, boolean> = { email: false, sms: false, slack: false };

  if (digestEmail) {
    try {
      await sendEmail({
        to: digestEmail,
        subject: `📊 ${total} new lead${total === 1 ? '' : 's'} today${hot.length ? ` — ${hot.length} HOT` : ''}`,
        text: emailBody,
      });
      sends.email = true;
    } catch (err) {
      console.error('[DailyDigest] Email failed:', err);
    }
  }

  // ── SMS digest (short) ────────────────────────────────────────────────────
  try {
    const smsBody = total > 0
      ? `📊 ATR Daily: ${total} new lead${total === 1 ? '' : 's'} (${hot.length} hot, ${warm.length} warm, ${cold.length} cold). ${hot.length ? `Call first: ${hot.slice(0, 2).map((c) => `${name(c)} ${c.phone ?? ''}`).join(', ')}. ` : ''}Details in your email + HubSpot.`
      : `📊 ATR Daily: 0 new leads in the last 24h. Check that ads and chat are live.`;
    await alertOwner(smsBody);
    sends.sms = true;
  } catch (err) {
    console.error('[DailyDigest] SMS failed:', err);
  }

  // ── Slack digest ──────────────────────────────────────────────────────────
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📊 *Daily Lead Digest — ${dateLabel}*\nNew leads: *${total}* (🔥 ${hot.length} hot / ${warm.length} warm / ${cold.length} cold)\n${total > 0 ? sourceLines : '_No new leads today — check traffic sources._'}${hotList ? `\n\n*Call now:*\n${hotList}` : ''}`,
        }),
      });
      sends.slack = true;
    } catch (err) {
      console.error('[DailyDigest] Slack failed:', err);
    }
  }

  return NextResponse.json({
    date: new Date().toISOString(),
    total,
    hot: hot.length,
    warm: warm.length,
    cold: cold.length,
    bySource: Object.fromEntries(bySource),
    sends,
  });
}

function name(c: RecentContact): string {
  return `${c.firstname ?? ''} ${c.lastname ?? ''}`.trim() || c.email || c.id;
}
