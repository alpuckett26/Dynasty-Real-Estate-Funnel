/**
 * Content Agent
 *
 * Goal: produce weekly social/email/ad assets from listings + market context.
 */

import { chatCompletion } from '@/lib/openai/client';
import { sanitizeAIOutput } from '@/lib/utils/compliance';
import { CONTENT_AGENT_PROMPT } from '@/lib/prompts';
import type { ContentAgentInput, ContentAgentOutput } from '@/types/agent';

const SYSTEM_PROMPT = CONTENT_AGENT_PROMPT;

export async function runContentAgent(
  input: ContentAgentInput
): Promise<ContentAgentOutput> {
  const prompt = `
Type: ${input.type}
Target audience: ${input.targetAudience ?? 'home buyers and sellers in the area'}
Tone: ${input.tone ?? 'professional'}
Context/listings: ${input.context}
${input.includeListings ? 'Include listing details in the content.' : ''}
`.trim();

  const raw = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 800, jsonMode: true }
  );

  let parsed: ContentAgentOutput;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { content: '', cta: 'Learn More' };
  }

  const { safe, flags } = sanitizeAIOutput(parsed.content ?? '');
  if (!safe) {
    console.warn('[ContentAgent] Compliance flags:', flags);
    parsed.content = 'Contact us to learn more about your local market.';
  }

  return parsed;
}
