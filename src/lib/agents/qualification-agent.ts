/**
 * Qualification Agent
 *
 * Goal: classify, score, and summarize a lead from conversation history.
 * Output: structured JSON matching QualificationAgentOutput schema.
 */

import { chatCompletion } from '@/lib/openai/client';
import { scoreLead } from '@/lib/scoring/lead-scorer';
import { QUALIFICATION_AGENT_PROMPT } from '@/lib/prompts';
import type { QualificationAgentInput, QualificationAgentOutput } from '@/types/agent';

const SYSTEM_PROMPT = QUALIFICATION_AGENT_PROMPT;

export async function runQualificationAgent(
  input: QualificationAgentInput
): Promise<QualificationAgentOutput> {
  const conversationText = input.conversationHistory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const contactText = JSON.stringify(input.capturedContact, null, 2);

  const prompt = `
Source: ${input.source}

Captured Contact Info:
${contactText}

Conversation:
${conversationText}

Classify this lead.
`.trim();

  const raw = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.2, maxTokens: 800, jsonMode: true }
  );

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback to safe defaults
    parsed = {
      leadType: 'unknown',
      timelineBucket: 'unknown',
      financingStatus: 'unknown',
      areasOfInterest: [],
      budgetMin: null,
      budgetMax: null,
      requestedShowing: false,
      requestedPricingConsult: false,
      handoffRequired: false,
      handoffReason: '',
      crmSummary: 'Unable to parse conversation.',
      recommendedNextAction: 'Manual review required.',
    };
  }

  // Compute scores via scoring engine
  const scoreResult = scoreLead({
    timeline: (parsed.timelineBucket as string | undefined) as Parameters<typeof scoreLead>[0]['timeline'],
    financingStatus: (parsed.financingStatus as string | undefined) as Parameters<typeof scoreLead>[0]['financingStatus'],
    hasArea: Array.isArray(parsed.areasOfInterest) && parsed.areasOfInterest.length > 0,
    hasBudget: !!(parsed.budgetMin || parsed.budgetMax),
    requestedShowing: parsed.requestedShowing as boolean,
    requestedPricingConsult: parsed.requestedPricingConsult as boolean,
    isPartner: parsed.leadType === 'partner',
  });

  return {
    leadType: parsed.leadType as QualificationAgentOutput['leadType'],
    timelineBucket: parsed.timelineBucket as QualificationAgentOutput['timelineBucket'],
    financingStatus: parsed.financingStatus as QualificationAgentOutput['financingStatus'],
    areasOfInterest: (parsed.areasOfInterest as string[]) ?? [],
    budgetMin: (parsed.budgetMin as number) ?? undefined,
    budgetMax: (parsed.budgetMax as number) ?? undefined,
    motivationScore: scoreResult.motivationScore,
    urgencyScore: scoreResult.urgencyScore,
    totalScore: scoreResult.totalScore,
    route: scoreResult.route,
    handoffRequired: (parsed.handoffRequired as boolean) ?? false,
    handoffReason: (parsed.handoffReason as string) || undefined,
    crmSummary: (parsed.crmSummary as string) ?? '',
    recommendedNextAction: (parsed.recommendedNextAction as string) ?? '',
    rawResponse: raw,
  };
}
