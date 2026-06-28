/**
 * Reputation / Referral Agent
 *
 * Goal: drive reviews and referrals post-close via personalized outreach.
 * Timing: 3-day review request, 7-day referral ask, 365-day anniversary.
 * Never: offer compensation for reviews, combine review + referral in one message.
 */

import { chatCompletion } from '@/lib/openai/client';
import { validateConsentBeforeSend, sanitizeAIOutput } from '@/lib/utils/compliance';
import { runGuardrailCheck, resolveGuardrailedText } from '@/lib/utils/guardrail';
import { REPUTATION_AGENT_PROMPT } from '@/lib/prompts';

export type ReputationMessageType = 'review_request' | 'referral_ask' | 'anniversary';

export interface ReputationAgentInput {
  contactId: string;
  firstName: string;
  lastName: string;
  closedPropertyAddress?: string;
  agentName?: string;
  daysSinceClose: number;
  preferredChannel: 'email' | 'sms' | 'dm';
  consent: Record<string, boolean>;
  context?: string;
}

export interface ReputationAgentOutput {
  shouldSend: boolean;
  messageType: ReputationMessageType;
  channel: 'email' | 'sms' | 'dm' | 'none';
  subject?: string;
  body: string;
}

function resolveMessageType(daysSinceClose: number): ReputationMessageType {
  if (daysSinceClose <= 5) return 'review_request';
  if (daysSinceClose <= 10) return 'referral_ask';
  return 'anniversary';
}

export async function runReputationAgent(
  input: ReputationAgentInput
): Promise<ReputationAgentOutput> {
  if (!validateConsentBeforeSend(input.preferredChannel, input.consent)) {
    return { shouldSend: false, messageType: 'review_request', channel: 'none', body: '' };
  }

  const messageType = resolveMessageType(input.daysSinceClose);

  const prompt = `
Contact: ${input.firstName} ${input.lastName}
Days since close: ${input.daysSinceClose}
Message type needed: ${messageType}
Channel: ${input.preferredChannel}
Property: ${input.closedPropertyAddress ?? 'their new home'}
Agent: ${input.agentName ?? 'your Dynasty agent'}
Additional context: ${input.context ?? 'none'}

Write the ${messageType} message for the ${input.preferredChannel} channel.
`.trim();

  const raw = await chatCompletion(
    [
      { role: 'system', content: REPUTATION_AGENT_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.65, maxTokens: 400, jsonMode: true }
  );

  let parsed: { messageType: ReputationMessageType; channel: string; subject?: string; body: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { shouldSend: false, messageType, channel: 'none', body: '' };
  }

  // Layer 1: regex compliance check
  const { safe, flags } = sanitizeAIOutput(parsed.body);
  if (!safe) {
    console.warn('[ReputationAgent] Regex compliance flags:', flags);
    return { shouldSend: false, messageType, channel: 'none', body: '' };
  }

  // Layer 2: LLM semantic guardrail check
  const guardrail = await runGuardrailCheck(parsed.body);
  const finalBody = resolveGuardrailedText(parsed.body, guardrail);
  if (finalBody === null) {
    console.error('[ReputationAgent] Guardrail blocked message — flags:', guardrail.flags);
    return { shouldSend: false, messageType, channel: 'none', body: '' };
  }

  return {
    shouldSend: true,
    messageType: parsed.messageType ?? messageType,
    channel: parsed.channel as ReputationAgentOutput['channel'],
    subject: parsed.subject,
    body: finalBody,
  };
}
