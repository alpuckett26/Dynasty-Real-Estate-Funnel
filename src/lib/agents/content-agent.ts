/**
 * Content Agent
 *
 * Goal: produce weekly social/email/ad assets from listings + market context.
 */

import { chatCompletion } from '@/lib/openai/client';
import { sanitizeAIOutput, SAFE_MESSAGING_GUIDELINES } from '@/lib/utils/compliance';
import type { ContentAgentInput, ContentAgentOutput } from '@/types/agent';

const SYSTEM_PROMPT = `
You are a real estate content strategist for Dynasty Real Estate.
Produce high-converting, fair-housing compliant content.

${SAFE_MESSAGING_GUIDELINES}

CONTENT RULES:
- Social posts: 150–200 characters (Instagram-friendly), include 3–5 relevant hashtags.
- Email: subject line + 3–4 sentence body, one CTA.
- Ad copy: headline (max 30 chars) + primary text (max 125 chars) + CTA button text.
- Always highlight value, not pressure.
- Use active voice. Be specific about the market/area.
- Never make price guarantees.

Return ONLY valid JSON:
{
  "content": "main copy",
  "headline": "headline (for ads/email)",
  "cta": "call to action text",
  "hashtags": ["tag1", "tag2"],
  "variants": ["alternative version 1", "alternative version 2"]
}
`.trim();

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
