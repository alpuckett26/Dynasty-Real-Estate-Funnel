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

  // Form answers are the highest-signal input we have. Without them the model
  // sees only a name and email and correctly returns "unknown" for everything,
  // which scores every form lead as cold no matter what they selected.
  const structured = input.structuredFields ?? {};
  const structuredText = Object.entries(structured)
    .filter(([k, v]) => v && !k.startsWith('utm_'))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const prompt = `
Source: ${input.source}

Captured Contact Info:
${contactText}

${structuredText ? `Form Answers (authoritative — prefer these over inference):\n${structuredText}\n` : ''}
Conversation:
${conversationText}

Classify this lead.
`.trim();

  let raw = '';
  let llmFailed = false;
  try {
    raw = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.2, maxTokens: 800, jsonMode: true }
    );
  } catch (err) {
    // Never let an LLM outage cost us the lead — fall back to the structured
    // form fields and let the caller still write the contact to HubSpot.
    console.error('[QualificationAgent] LLM call failed, using structured fallback:', err);
    llmFailed = true;
  }

  let parsed: Record<string, unknown>;
  try {
    if (llmFailed) throw new Error('llm unavailable');
    parsed = JSON.parse(raw);
  } catch {
    parsed = fallbackQualification(input, llmFailed);
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

/**
 * Qualify from the structured form fields alone. Used when the LLM is
 * unavailable or returns unparseable JSON. A form submission already carries
 * timeline, financing, area, and budget, so this loses the free-text nuance
 * but keeps the lead — and its routing — intact.
 */
function fallbackQualification(
  input: QualificationAgentInput,
  llmFailed: boolean
): Record<string, unknown> {
  const f = input.structuredFields ?? {};
  const areas = (f.areasOfInterest ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

  const budgetMin = Number(f.budgetMin) || null;
  const budgetMax = Number(f.budgetMax) || null;

  const reason = llmFailed
    ? 'Qualified from form fields only — AI enrichment was unavailable.'
    : 'Qualified from form fields only — AI response could not be parsed.';

  return {
    leadType: f.intent || 'unknown',
    timelineBucket: f.timeline || 'unknown',
    financingStatus: f.financingStatus || 'unknown',
    areasOfInterest: areas,
    budgetMin,
    budgetMax,
    requestedShowing: false,
    requestedPricingConsult: false,
    // Flag for a human so a degraded lead is reviewed rather than sitting cold.
    handoffRequired: true,
    handoffReason: reason,
    crmSummary: reason,
    recommendedNextAction: 'Review the raw form submission and follow up manually.',
  };
}
