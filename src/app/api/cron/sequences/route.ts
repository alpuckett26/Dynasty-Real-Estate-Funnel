/**
 * Cron: Process timed sequence steps
 * Runs hourly via Vercel Cron.
 * Queries HubSpot for contacts where sequence_next_send_at <= now, sends next step, advances state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { processStep, LeadContext } from '@/lib/sequences/runner';
import { updateContact } from '@/lib/hubspot/client';
import { ALL_SEQUENCES } from '@/lib/sequences';
import { isAuthorizedCron } from '@/lib/utils/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Security: only allow Vercel cron or requests with CRON_SECRET
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ skipped: 'No HubSpot token' });

  const client = new Client({ accessToken: token });
  const now = new Date().toISOString();

  // Find contacts due for their next sequence step
  let contacts: Array<{ id: string; properties: Record<string, string | null> }> = [];
  try {
    const result = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: 'sequence_id', operator: 'HAS_PROPERTY' as never },
            { propertyName: 'sequence_next_send_at', operator: 'LTE' as never, value: now },
          ],
        },
      ],
      properties: ['firstname', 'email', 'phone', 'sequence_id', 'sequence_step', 'sequence_enrolled_at', 'consent_sms', 'consent_email', 'hs_lead_status'],
      sorts: [],
      limit: 100,
      after: '0',
    });
    contacts = result.results;
  } catch (err) {
    console.error('[CronSequences] Search failed:', err);
    return NextResponse.json({ error: 'HubSpot search failed' }, { status: 500 });
  }

  let sent = 0;
  let completed = 0;

  for (const contact of contacts) {
    const p = contact.properties;
    const sequenceId = p.sequence_id ?? '';
    const stepIndex = parseInt(p.sequence_step ?? '0', 10);

    const sequence = ALL_SEQUENCES.find((s) => s.id === sequenceId);
    if (!sequence || stepIndex >= sequence.steps.length) {
      // Sequence complete — clear state
      await updateContact(contact.id, {
        sequence_id: '',
        sequence_step: 0,
        sequence_next_send_at: '',
      } as never).catch(console.error);
      completed++;
      continue;
    }

    const step = sequence.steps[stepIndex];
    const ctx: LeadContext = {
      contactId: contact.id,
      firstName: p.firstname ?? 'there',
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      tags: [],
      consentEmail: p.consent_email === 'true',
      consentSms: p.consent_sms === 'true',
    };

    try {
      await processStep(ctx, step, sequenceId, stepIndex);
      sent++;
    } catch (err) {
      console.error(`[CronSequences] Step failed for contact ${contact.id}:`, err);
    }

    // Advance to next step
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < sequence.steps.length) {
      const nextStep = sequence.steps[nextStepIndex];
      const nextSendAt = new Date(Date.now() + nextStep.delayHours * 60 * 60 * 1000).toISOString();
      await updateContact(contact.id, {
        sequence_step: nextStepIndex,
        sequence_next_send_at: nextSendAt,
      } as never).catch(console.error);
    } else {
      // Done — clear state
      await updateContact(contact.id, {
        sequence_id: '',
        sequence_step: 0,
        sequence_next_send_at: '',
      } as never).catch(console.error);
      completed++;
    }
  }

  return NextResponse.json({ processed: contacts.length, sent, completed });
}
