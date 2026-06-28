/**
 * Supervisor Guardrail — LLM-based compliance check
 *
 * Runs AFTER regex sanitizeAIOutput() as a semantic second pass.
 * Calls GPT-4o with SUPERVISOR_GUARDRAIL_PROMPT to catch violations
 * that pattern-matching misses (steering by omission, subtle guarantees, etc.).
 *
 * Failure mode: fail-open with a logged warning — infra errors must not
 * silently block legitimate messages or block the request thread.
 */

import { chatCompletion } from '@/lib/openai/client';
import { SUPERVISOR_GUARDRAIL_PROMPT } from '@/lib/prompts';

export interface GuardrailResult {
  approved: boolean;
  flags: string[];
  severity: 'block' | 'warn' | 'none';
  editedOutput: string;
}

const FALLBACK_APPROVED: GuardrailResult = {
  approved: true,
  flags: ['guardrail_check_failed'],
  severity: 'warn',
  editedOutput: '',
};

export async function runGuardrailCheck(text: string): Promise<GuardrailResult> {
  if (!text || !text.trim()) {
    return { approved: true, flags: [], severity: 'none', editedOutput: '' };
  }

  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: SUPERVISOR_GUARDRAIL_PROMPT },
        { role: 'user', content: `Review this AI-generated output:\n\n${text}` },
      ],
      { temperature: 0, maxTokens: 400, jsonMode: true }
    );

    let parsed: GuardrailResult;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[Guardrail] Failed to parse LLM response — failing open');
      return { ...FALLBACK_APPROVED };
    }

    // Normalize — LLM may return unexpected shapes
    const result: GuardrailResult = {
      approved: parsed.approved ?? true,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      severity: (['block', 'warn', 'none'] as const).includes(parsed.severity as 'block' | 'warn' | 'none')
        ? parsed.severity
        : 'none',
      editedOutput: typeof parsed.editedOutput === 'string' ? parsed.editedOutput : '',
    };

    if (result.severity === 'block') {
      console.error('[Guardrail] BLOCKED output:', result.flags, '— text suppressed');
    } else if (result.severity === 'warn') {
      console.warn('[Guardrail] WARNING flags:', result.flags);
    }

    return result;
  } catch (err) {
    console.error('[Guardrail] LLM call failed — failing open:', err);
    return { ...FALLBACK_APPROVED };
  }
}

/**
 * Resolve the final text to send, given a guardrail result.
 * Returns null if the message should be blocked.
 */
export function resolveGuardrailedText(
  original: string,
  result: GuardrailResult,
  fallback?: string
): string | null {
  if (result.severity === 'block') return null;
  if (result.severity === 'warn' && result.editedOutput) return result.editedOutput;
  return original;
}
