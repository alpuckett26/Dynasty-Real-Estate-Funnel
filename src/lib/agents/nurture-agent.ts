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
} from '@/lib/utils/compliance';
import { runGuardrailCheck, resolveGuardrailedText } from '@/lib/utils/guardrail';
import { NURTURE_AGENT_PROMPT } from '@/lib/prompts';
import type { NurtureAgentInput, NurtureAgentOutput } from '@/types/agent';

const REACTIVATION_SYSTEM_PROMPT = NURTURE_AGENT_PROMPT;

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

  // Layer 1: regex compliance check
  const { safe, flags } = sanitizeAIOutput(parsed.body);
  if (!safe) {
    console.warn('[NurtureAgent] Regex compliance flags:', flags, '— message suppressed');
    return { shouldSend: false, channel: 'none', body: '' };
  }

  // Layer 2: LLM semantic guardrail check
  const guardrail = await runGuardrailCheck(parsed.body);
  const finalBody = resolveGuardrailedText(parsed.body, guardrail);
  if (finalBody === null) {
    console.error('[NurtureAgent] Guardrail blocked message — flags:', guardrail.flags);
    return { shouldSend: false, channel: 'none', body: '' };
  }

  return {
    shouldSend: true,
    channel: input.preferredChannel,
    subject: parsed.subject,
    body: finalBody,
    sequenceId: `reactivation-${input.leadRoute}-${input.daysSinceLastInteraction}d`,
  };
}

function getNext8am(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}
