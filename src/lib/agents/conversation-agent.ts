/**
 * Conversation Agent
 *
 * Goal: capture intent fast, collect contact data, answer FAQs.
 * Never: give legal advice, discriminatory suggestions, pricing guarantees.
 * Must collect: name, contact, intent, area, timeline, preferred contact method.
 */

import { chatCompletion } from '@/lib/openai/client';
import { sanitizeAIOutput } from '@/lib/utils/compliance';
import { CONVERSATION_AGENT_PROMPT } from '@/lib/prompts';
import type { ConversationAgentInput, ConversationAgentOutput } from '@/types/agent';
import type { ConversationMessage, LeadContact } from '@/types/lead';

const SYSTEM_PROMPT = CONVERSATION_AGENT_PROMPT;

export async function runConversationAgent(
  input: ConversationAgentInput
): Promise<ConversationAgentOutput> {
  // Inject what we already know so the model never re-asks for it
  const captured = input.capturedContact ?? {};
  const knownFields = Object.entries(captured)
    .filter(([, v]) => v && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const systemWithContext = knownFields
    ? `${SYSTEM_PROMPT}\n\nALREADY COLLECTED — do NOT ask for these again: ${knownFields}`
    : SYSTEM_PROMPT;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemWithContext },
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
