/**
 * Cron: Reactivation Bot
 * Runs daily at 9am via Vercel Cron.
 * Scans HubSpot for leads silent for 30+ days and sends a personalized re-engagement message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { runNurtureAgent } from '@/lib/agents/nurture-agent';
import { sendSMS } from '@/lib/sms/twilio';
import { sendEmail } from '@/lib/email/resend';
import { updateContact } from '@/lib/hubspot/client';
import { isAuthorizedCron } from '@/lib/utils/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ skipped: 'No HubSpot token' });

  const client = new Client({ accessToken: token });
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  let contacts: Array<{ id: string; properties: Record<string, string | null> }> = [];
  try {
    const result = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            // Has a phone or email
            { propertyName: 'email', operator: 'HAS_PROPERTY' as never },
            // Last interaction was 30+ days ago
            { propertyName: 'last_meaningful_interaction', operator: 'LT' as never, value: cutoff },
            // Not currently in an active sequence
            { propertyName: 'sequence_id', operator: 'NOT_HAS_PROPERTY' as never },
          ],
        },
      ],
      properties: ['firstname', 'email', 'phone', 'lead_route', 'consent_sms', 'consent_email', 'consultation_status', 'last_meaningful_interaction'],
      sorts: [],
      limit: 50,
      after: '0',
    });
    contacts = result.results;
  } catch (err) {
    console.error('[CronReactivate] Search failed:', err);
    return NextResponse.json({ error: 'HubSpot search failed' }, { status: 500 });
  }

  let reactivated = 0;

  for (const contact of contacts) {
    const p = contact.properties;
    if (!p.email && !p.phone) continue;

    const lastInteraction = p.last_meaningful_interaction
      ? new Date(p.last_meaningful_interaction)
      : new Date(0);
    const daysSince = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

    const preferredChannel = p.consent_sms === 'true' && p.phone ? 'sms' : 'email';

    try {
      const result = await runNurtureAgent({
        contactId: contact.id,
        currentStage: p.consultation_status ?? 'unknown',
        daysSinceLastInteraction: daysSince,
        leadRoute: (p.lead_route?.toLowerCase() ?? 'cold') as 'hot' | 'warm' | 'cold',
        preferredChannel,
        consent: {
          sms: p.consent_sms === 'true',
          email: p.consent_email === 'true',
          dm: false,
        },
      });

      if (!result.shouldSend || !result.body) continue;

      if (result.channel === 'sms' && p.phone) {
        await sendSMS(p.phone, result.body);
      } else if (result.channel === 'email' && p.email) {
        await sendEmail({
          to: p.email,
          subject: result.subject ?? 'Checking in from SMRG Real Estate',
          text: result.body,
        });
      }

      // Update last_meaningful_interaction so we don't re-trigger next cycle
      await updateContact(contact.id, {
        last_meaningful_interaction: new Date().toISOString(),
      } as never).catch(console.error);

      reactivated++;
    } catch (err) {
      console.error(`[CronReactivate] Failed for contact ${contact.id}:`, err);
    }
  }

  return NextResponse.json({ scanned: contacts.length, reactivated });
}
