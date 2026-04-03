/**
 * Lead Gen Processor
 *
 * Takes raw leads from scrapers, deduplicates against HubSpot,
 * creates contacts, and fires outreach messages.
 */

import { findContactByEmailOrPhone, createContact, createNote } from '@/lib/hubspot/client';
import { sendSMS } from '@/lib/sms/twilio';
import { sendEmail } from '@/lib/email/resend';
import { alertOwner } from '@/lib/sms/twilio';
import type { CraigslistLead } from './sources/craigslist';
import type { FsboComLead } from './sources/fsbo-com';
import type { BiggerPocketsLead } from './sources/biggerpockets';
import type { RedditLead } from './sources/reddit';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://dynasty-real-estate-funnel.vercel.app/book';

export interface ProcessResult {
  source: string;
  created: number;
  skipped: number;
  errors: number;
}

// ─── Craigslist FSBO ─────────────────────────────────────────────────────────

export async function processCraigslistLeads(leads: CraigslistLead[]): Promise<ProcessResult> {
  const result: ProcessResult = { source: 'craigslist-fsbo', created: 0, skipped: 0, errors: 0 };

  for (const lead of leads) {
    try {
      // Dedup check
      const existing = await findContactByEmailOrPhone(lead.email, lead.phone);
      if (existing) { result.skipped++; continue; }

      // Create HubSpot contact
      const contactId = await createContact({
        firstname: 'FSBO Seller',
        lastname: extractNameFromTitle(lead.title),
        email: lead.email,
        phone: lead.phone,
        lead_type: 'Seller',
        channel_source: 'craigslist-fsbo',
        lead_route: 'Warm',
        last_meaningful_interaction: new Date().toISOString(),
      });

      // Add note with listing details
      await createNote(contactId, [
        `[FSBO LEAD — Craigslist — ${new Date().toLocaleDateString()}]`,
        `Title: ${lead.title}`,
        lead.price ? `Asking: ${lead.price}` : '',
        `URL: ${lead.url}`,
        lead.description ? `\nListing text:\n${lead.description}` : '',
      ].filter(Boolean).join('\n'));

      // Send outreach SMS if phone available
      if (lead.phone) {
        const msg = `Hi! My name is Adreanne with Dynasty Real Estate. I saw your home listed on Craigslist and wanted to reach out. Many FSBO sellers end up getting more money working with an agent — I'd love to show you the numbers. Free, no obligation. Can I give you a quick call? ${CALENDLY_URL}`;
        await sendSMS(lead.phone, msg).catch(console.error);
      } else if (lead.email) {
        await sendEmail({
          to: lead.email,
          subject: 'Selling your home? A quick note from Dynasty Real Estate',
          text: `Hi,\n\nI came across your home listing on Craigslist and wanted to reach out. I'm Adreanne Aranha with Dynasty Real Estate in the area.\n\nMany homeowners who start FSBO end up getting significantly more by working with an agent — once you factor in negotiation, exposure, and the buyer's agent commission structure. I'd love to walk you through the numbers, completely free and with no pressure.\n\nWould you be open to a quick 15-minute call? You can grab a time here: ${CALENDLY_URL}\n\nBest,\nAdreanne Aranha\nDynasty Real Estate\n(225) 284-6854`,
        }).catch(console.error);
      }

      result.created++;
    } catch (err) {
      console.error('[LeadGen] Craigslist process error:', err);
      result.errors++;
    }
  }

  return result;
}

// ─── FSBO.com ────────────────────────────────────────────────────────────────

export async function processFsboComLeads(leads: FsboComLead[]): Promise<ProcessResult> {
  const result: ProcessResult = { source: 'fsbo-com', created: 0, skipped: 0, errors: 0 };

  for (const lead of leads) {
    try {
      const existing = await findContactByEmailOrPhone(lead.email, lead.phone);
      if (existing) { result.skipped++; continue; }

      const contactId = await createContact({
        firstname: 'FSBO Seller',
        lastname: extractNameFromTitle(lead.title),
        email: lead.email,
        phone: lead.phone,
        lead_type: 'Seller',
        channel_source: 'fsbo-com' as never,
        lead_route: 'Warm',
        last_meaningful_interaction: new Date().toISOString(),
      });

      await createNote(contactId, [
        `[FSBO LEAD — FSBO.com — ${new Date().toLocaleDateString()}]`,
        `Title: ${lead.title}`,
        lead.price ? `Asking: ${lead.price}` : '',
        lead.address ? `Address: ${lead.address}` : '',
        `URL: ${lead.url}`,
        lead.description ? `\nListing text:\n${lead.description}` : '',
      ].filter(Boolean).join('\n'));

      if (lead.phone) {
        const msg = `Hi! I'm Adreanne with Dynasty Real Estate. I saw your home listed on FSBO.com. Many sellers get significantly more by working with an agent — I'd love to show you the numbers. Free, no pressure. Can I give you a quick call? ${CALENDLY_URL}`;
        await sendSMS(lead.phone, msg).catch(console.error);
      } else if (lead.email) {
        await sendEmail({
          to: lead.email,
          subject: 'Your FSBO listing — a quick note from Dynasty Real Estate',
          text: `Hi,\n\nI came across your listing on FSBO.com and wanted to reach out. I'm Adreanne Aranha with Dynasty Real Estate.\n\nMost FSBO sellers end up netting more by working with an agent once you factor in pricing strategy, negotiation, and buyer agent commission structures. I'd love to walk you through the numbers — completely free, no pressure.\n\nCan we set up a quick 15-minute call? ${CALENDLY_URL}\n\nBest,\nAdreanne Aranha\nDynasty Real Estate\n(225) 284-6854`,
        }).catch(console.error);
      }

      result.created++;
    } catch (err) {
      console.error('[LeadGen] FSBO.com process error:', err);
      result.errors++;
    }
  }

  return result;
}

// ─── BiggerPockets Investor Leads ────────────────────────────────────────────

export async function processBiggerPocketsLeads(leads: BiggerPocketsLead[]): Promise<ProcessResult> {
  const result: ProcessResult = { source: 'biggerpockets', created: 0, skipped: 0, errors: 0 };

  const highIntent = leads.filter((l) => l.intentScore >= 4);
  if (highIntent.length === 0) return result;

  // Alert Adreanne with top posts for manual outreach via BP messaging
  const alertLines = highIntent.slice(0, 5).map((l, i) =>
    `${i + 1}. ${l.intentType.toUpperCase()} (score ${l.intentScore}) — ${l.author}\n   "${l.title.slice(0, 80)}"\n   ${l.url}`
  );

  const alertMsg = `🏦 Dynasty Investor Intel — ${highIntent.length} BiggerPockets leads today:\n\n${alertLines.join('\n\n')}\n\nMessage them via BP or comment on their post.`;
  await alertOwner(alertMsg).catch(console.error);

  // Create prospect records in HubSpot
  for (const lead of highIntent.slice(0, 10)) {
    try {
      const contactId = await createContact({
        firstname: `BP: ${lead.author}`,
        lastname: `(${lead.intentType})`,
        lead_type: lead.intentType === 'seller' ? 'Seller' : 'Buyer',
        channel_source: 'biggerpockets' as never,
        lead_route: 'Warm',
        last_meaningful_interaction: new Date().toISOString(),
      });

      await createNote(contactId, [
        `[BIGGERPOCKETS LEAD — ${new Date().toLocaleDateString()}]`,
        `Intent: ${lead.intentType} | Score: ${lead.intentScore}/10`,
        `Author: ${lead.author}`,
        `Post: "${lead.title}"`,
        lead.body ? `\nContext: ${lead.body}` : '',
        `\nURL: ${lead.url}`,
        `\nAction: Message via BiggerPockets or comment on post.`,
      ].filter(Boolean).join('\n'));

      result.created++;
    } catch (err) {
      console.error('[LeadGen] BiggerPockets process error:', err);
      result.errors++;
    }
  }

  return result;
}

// ─── Reddit Intent Leads ─────────────────────────────────────────────────────

export async function processRedditLeads(leads: RedditLead[]): Promise<ProcessResult> {
  const result: ProcessResult = { source: 'reddit-monitor', created: 0, skipped: 0, errors: 0 };

  // Reddit leads don't have contact info — we create prospect records
  // and alert Adreanne so she can manually reach out via Reddit DM
  const highIntent = leads.filter((l) => l.intentScore >= 5);

  if (highIntent.length === 0) return result;

  // Batch alert Adreanne about high-intent posts
  const alertLines = highIntent.slice(0, 5).map((l, i) =>
    `${i + 1}. r/${l.subreddit} — ${l.intentType} (score ${l.intentScore})\n   "${l.title.slice(0, 80)}"\n   ${l.url}`
  );

  const alertMsg = `📡 Dynasty Lead Intel — ${highIntent.length} high-intent Reddit posts today:\n\n${alertLines.join('\n\n')}\n\nReach out via Reddit DM or reply to the post.`;
  await alertOwner(alertMsg).catch(console.error);

  // Also create prospect records in HubSpot for tracking
  for (const lead of highIntent.slice(0, 10)) {
    try {
      const contactId = await createContact({
        firstname: `Reddit: u/${lead.author}`,
        lastname: `(${lead.subreddit})`,
        lead_type: capitalise(lead.intentType) as never,
        channel_source: 'reddit-monitor',
        lead_route: 'Warm',
        last_meaningful_interaction: new Date().toISOString(),
      });

      await createNote(contactId, [
        `[REDDIT LEAD — r/${lead.subreddit} — ${new Date().toLocaleDateString()}]`,
        `Intent: ${lead.intentType} | Score: ${lead.intentScore}/10`,
        `Post: "${lead.title}"`,
        lead.body ? `\nBody: ${lead.body}` : '',
        `\nURL: ${lead.url}`,
        `\nAction: Reach out via Reddit DM to u/${lead.author}`,
      ].filter(Boolean).join('\n'));

      result.created++;
    } catch (err) {
      result.errors++;
    }
  }

  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNameFromTitle(title: string): string {
  // Try to extract a name from common CL title patterns
  // e.g. "3bd/2ba home — asking $250k — call Bob"
  const nameMatch = title.match(/(?:call|contact|ask for|owner:?)\s+([A-Z][a-z]+)/i);
  return nameMatch ? nameMatch[1] : 'FSBO';
}

function capitalise(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
