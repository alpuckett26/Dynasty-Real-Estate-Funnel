/**
 * Nurture / Reactivation Agent
 *
 * Goal: timely, personalized follow-up without spam.
 * Rules: respect consent + quiet hours; stop on opt-out; no autonomous SMS blasting.
 */

import { chatCompletion } from '@/lib/openai/client';
import {
  validateConsentBeforeSend,
  isWithinQuietHours,
  sanitizeAIOutput,
  SAFE_MESSAGING_GUIDELINES,
} from '@/lib/utils/compliance';
import type { NurtureAgentInput, NurtureAgentOutput } from '@/types/agent';

const REACTIVATION_SYSTEM_PROMPT = `
You are a real estate follow-up specialist for Dynasty Real Estate.
Write a short, personalized outreach message to re-engage a dormant lead.

${SAFE_MESSAGING_GUIDELINES}

RULES:
- Maximum 3 sentences for SMS; 5 sentences for email.
- Be warm and helpful, NOT pushy or salesy.
- Reference their specific situation (buyer, seller, area, timeline) if known.
- Offer genuine value: market update, new listings, or a quick check-in.
- End with a single soft CTA (not a demand).
- Never mention how long it's been since last contact.
- All language must be fair-housing safe.

Return ONLY valid JSON:
{
  "subject": "Email subject line (empty string for SMS)",
  "body": "Message body"
}
`.trim();

export async function runNurtureAgent(
  input: NurtureAgentInput
): Promise<NurtureAgentOutput> {
  // Gate 1: Consent check
  if (!validateConsentBeforeSend(input.preferredChannel, input.consent)) {
    return { shouldSend: false, channel: 'none', body: '' };
  }

  // Gate 2: Quiet hours (only for SMS)
  if (input.preferredChannel === 'sms' && isWithinQuietHours()) {
    const tomorrow8am = getNext8am();
    return {
      shouldSend: true,
      channel: 'sms',
      body: '',
      scheduledFor: tomorrow8am,
    };
  }

  // Gate 3: Minimum inactivity threshold
  if (input.daysSinceLastInteraction < 30) {
    return { shouldSend: false, channel: 'none', body: '' };
  }

  const prompt = `
Contact stage: ${input.currentStage}
Days since last interaction: ${input.daysSinceLastInteraction}
Lead route: ${input.leadRoute}
Preferred channel: ${input.preferredChannel}
Additional context: ${input.context ?? 'none'}

Write a ${input.preferredChannel === 'email' ? 'email' : 'SMS'} reactivation message.
`.trim();

  const raw = await chatCompletion(
    [
      { role: 'system', content: REACTIVATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, maxTokens: 400, jsonMode: true }
  );

  let parsed: { subject?: string; body: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { body: '' };
  }

  if (!parsed.body) {
    return { shouldSend: false, channel: 'none', body: '' };
  }

  const { safe, flags } = sanitizeAIOutput(parsed.body);
  if (!safe) {
    console.warn('[NurtureAgent] Compliance flags:', flags, '— message suppressed');
    return { shouldSend: false, channel: 'none', body: '' };
  }

  return {
    shouldSend: true,
    channel: input.preferredChannel,
    subject: parsed.subject,
    body: parsed.body,
    sequenceId: `reactivation-${input.leadRoute}-${input.daysSinceLastInteraction}d`,
  };
}

function getNext8am(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}
