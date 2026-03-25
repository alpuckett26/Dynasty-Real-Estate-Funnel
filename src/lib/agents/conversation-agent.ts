/**
 * Conversation Agent
 *
 * Goal: capture intent fast, collect contact data, answer FAQs.
 * Never: give legal advice, discriminatory suggestions, pricing guarantees.
 * Must collect: name, contact, intent, area, timeline, preferred contact method.
 */

import { chatCompletion } from '@/lib/openai/client';
import { sanitizeAIOutput, SAFE_MESSAGING_GUIDELINES } from '@/lib/utils/compliance';
import type { ConversationAgentInput, ConversationAgentOutput } from '@/types/agent';
import type { ConversationMessage, LeadContact } from '@/types/lead';

const SYSTEM_PROMPT = `
You are Dynasty, a friendly and professional real estate AI assistant for Dynasty Real Estate.
Your mission: help potential clients buy, sell, or relocate — and book a consultation with an agent.

${SAFE_MESSAGING_GUIDELINES}

CONVERSATION RULES:
- Be warm, confident, and concise. Max 3 sentences per reply.
- Collect (in order, naturally): full name → contact info (email or phone) → intent (buy/sell/both) → area(s) of interest → timeline → preferred contact method.
- Never ask more than one question at a time.
- If the user asks about pricing, say: "Our agents will give you a detailed market analysis — I'd love to book a quick call for you."
- If the user mentions they're a vendor, investor, or agent looking to partner, say: "Great! I'll flag you for our partner team."
- If asked legal questions, say: "That's a great question for a licensed attorney — I can connect you with resources."
- When you have name + contact info, offer to book a consultation.
- Keep all language fair-housing safe.

CONTACT EXTRACTION:
When you identify contact info from the conversation, include it in your response as a JSON block at the END of your message in this exact format:
<contact_data>{"firstName": "", "lastName": "", "email": "", "phone": "", "intent": "", "area": "", "timeline": ""}</contact_data>
Only include fields that have been confirmed by the user. Omit uncertain fields.

ESCALATION:
If the user expresses urgency (listing expires, eviction, legal dispute, harassment), prepend [ESCALATE] to your reply.
`.trim();

export async function runConversationAgent(
  input: ConversationAgentInput
): Promise<ConversationAgentOutput> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...input.history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: input.userMessage },
  ];

  const raw = await chatCompletion(messages, { temperature: 0.5, maxTokens: 512 });

  // Parse contact data if present
  let capturedContact: Partial<LeadContact> = input.capturedContact ?? {};
  const contactMatch = raw.match(/<contact_data>([\s\S]*?)<\/contact_data>/);
  if (contactMatch) {
    try {
      const parsed = JSON.parse(contactMatch[1]);
      capturedContact = { ...capturedContact, ...filterEmpty(parsed) };
    } catch {
      // ignore parse errors
    }
  }

  // Strip the hidden contact_data block from the visible reply
  const visibleReply = raw
    .replace(/<contact_data>[\s\S]*?<\/contact_data>/, '')
    .replace('[ESCALATE]', '')
    .trim();

  const shouldEscalate = raw.startsWith('[ESCALATE]');

  // Compliance check
  const { flags } = sanitizeAIOutput(visibleReply);
  const safeReply =
    flags.length > 0
      ? "I'd be happy to help! Let me connect you with one of our agents who can give you personalized guidance."
      : visibleReply;

  const contactCaptured = !!(capturedContact.email || capturedContact.phone);

  const newMessage: ConversationMessage = {
    role: 'assistant',
    content: safeReply,
    timestamp: new Date().toISOString(),
  };

  const userMessage: ConversationMessage = {
    role: 'user',
    content: input.userMessage,
    timestamp: new Date().toISOString(),
  };

  return {
    reply: safeReply,
    updatedHistory: [...input.history, userMessage, newMessage],
    contactCaptured,
    capturedContact: contactCaptured ? (capturedContact as Partial<LeadContact>) : undefined,
    shouldEscalate,
    escalationReason: shouldEscalate ? 'User indicated urgency' : undefined,
    sessionId: input.sessionId,
  };
}

function filterEmpty(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v && v.trim() !== ''));
}
