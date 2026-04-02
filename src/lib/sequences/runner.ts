/**
 * Sequence Runner
 *
 * - enrollLead: fires step 0 immediately, writes sequence state to HubSpot
 * - processStep: sends a specific step (used by cron)
 * - substituteVars: replaces {firstName}, {calendlyUrl}, {rate*} placeholders
 */

import { sendSMS } from '@/lib/sms/twilio';
import { sendEmail } from '@/lib/email/resend';
import { updateContact } from '@/lib/hubspot/client';
import { getCurrentRates } from '@/lib/rates';
import { selectSequence } from './index';
import type { SequenceStep } from './index';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://dynasty-real-estate-funnel.vercel.app/book';

export interface LeadContext {
  contactId: string;
  firstName: string;
  email?: string;
  phone?: string;
  tags: string[];
  consentEmail: boolean;
  consentSms: boolean;
}

export async function enrollLead(ctx: LeadContext): Promise<void> {
  const sequence = selectSequence(ctx.tags);
  if (!sequence) return;

  // Fire step 0 immediately
  await processStep(ctx, sequence.steps[0], sequence.id, 0);

  if (sequence.steps.length <= 1) return;

  // Schedule step 1 by writing next_send_at to HubSpot
  const step1 = sequence.steps[1];
  const nextSendAt = new Date(Date.now() + step1.delayHours * 60 * 60 * 1000).toISOString();

  await updateContact(ctx.contactId, {
    sequence_id: sequence.id,
    sequence_step: 1,
    sequence_enrolled_at: new Date().toISOString(),
    sequence_next_send_at: nextSendAt,
  } as never).catch(console.error);
}

export async function processStep(
  ctx: LeadContext,
  step: SequenceStep,
  sequenceId: string,
  stepIndex: number
): Promise<void> {
  const rates = await getCurrentRates().catch(() => null);
  const body = substituteVars(step.body, ctx.firstName, rates);

  if (step.channel === 'sms' && ctx.consentSms && ctx.phone) {
    await sendSMS(ctx.phone, body);
  } else if (step.channel === 'email' && ctx.consentEmail && ctx.email) {
    await sendEmail({
      to: ctx.email,
      subject: substituteVars(step.subject ?? `Message from Dynasty Real Estate`, ctx.firstName, rates),
      text: body,
    });
  }

  // Apply tag if defined
  if (step.tag) {
    await updateContact(ctx.contactId, { hs_lead_status: step.tag } as never).catch(console.error);
  }
}

function substituteVars(
  template: string,
  firstName: string,
  rates: Awaited<ReturnType<typeof getCurrentRates>> | null
): string {
  let out = template
    .replace(/\{firstName\}/g, firstName)
    .replace(/\{calendlyUrl\}/g, CALENDLY_URL);

  if (rates) {
    out = out
      .replace(/\{rate30yr\}/g, `${rates.rate30yr.toFixed(2)}%`)
      .replace(/\{rate15yr\}/g, `${rates.rate15yr.toFixed(2)}%`)
      .replace(/\{rate5arm\}/g, `${rates.rate5arm.toFixed(2)}%`)
      .replace(/\{rateChange\}/g, rates.weekChange30yr !== null && rates.weekChange30yr !== 0
        ? `30-yr fixed is ${rates.weekChange30yr > 0 ? 'up' : 'down'} ${Math.abs(rates.weekChange30yr).toFixed(2)}% from last week.`
        : 'Rates are holding steady from last week.');
  }

  return out;
}
