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
import { alertOwner } from '@/lib/sms/twilio';

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
    // Nobody reads cron status codes. An expired HubSpot token stops all
    // nurture every day until someone is told.
    await alertOwner(
      `⚠️ Nurture sequences did not run: HubSpot search failed (${err instanceof Error ? err.message : String(err)}). ` +
        'No follow-ups go out until this is fixed — check HUBSPOT_ACCESS_TOKEN.'
    );
    return NextResponse.json({ error: 'HubSpot search failed' }, { status: 500 });
  }

  let sent = 0;
  let completed = 0;
  const failures: string[] = [];

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
      failures.push(`step ${stepIndex} of ${sequenceId} for ${contact.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Advance to next step
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < sequence.steps.length) {
      const nextStep = sequence.steps[nextStepIndex];
      const nextSendAt = new Date(Date.now() + nextStep.delayHours * 60 * 60 * 1000).toISOString();
      await updateContact(contact.id, {
        sequence_step: nextStepIndex,
        sequence_next_send_at: nextSendAt,
      } as never).catch((err) => {
        // Not advancing means this contact gets the same message again tomorrow.
        console.error(`[CronSequences] Could not advance contact ${contact.id}:`, err);
        failures.push(`advance ${contact.id} (will repeat step ${stepIndex}): ${err instanceof Error ? err.message : String(err)}`);
      });
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

  // A failed step is not retried — the contact advances either way so one bad
  // number cannot block a sequence forever. That made an empty Twilio balance
  // or a revoked Resend key invisible: the cron answered 200 while walking
  // every lead past messages that never went out. Say so instead.
  let alerted: string | null = null;
  if (failures.length > 0) {
    alerted = await alertOwner(
      `⚠️ Nurture sequences: ${failures.length} of ${contacts.length} due message${contacts.length === 1 ? '' : 's'} failed today.\n` +
        failures.slice(0, 3).map((f) => `• ${f}`).join('\n') +
        (failures.length > 3 ? `\n…and ${failures.length - 3} more in the Vercel logs.` : '') +
        (sent === 0 && contacts.length > 0 ? '\nNOTHING was sent — check Twilio balance and the Resend key.' : '')
    );
  }

  return NextResponse.json(
    { processed: contacts.length, sent, completed, failed: failures.length, alerted },
    { status: failures.length > 0 && sent === 0 ? 500 : 200 }
  );
}
