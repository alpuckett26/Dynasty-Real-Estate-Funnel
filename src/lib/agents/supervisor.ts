/**
 * Supervisor / Orchestrator
 *
 * Decides which agent runs next.
 * Enforces guardrails and handoff rules.
 * Maintains session state throughout the funnel.
 */

import { after } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { runConversationAgent } from './conversation-agent';
import { runQualificationAgent } from './qualification-agent';
import { runCRMActionAgent } from './crm-action-agent';
import { runNurtureAgent } from './nurture-agent';
import { createAuditEntry } from '@/lib/utils/audit';
import { notifyHotLead } from '@/lib/notifications/slack';
import { alertOwner } from '@/lib/sms/twilio';
import { runGuardrailCheck, resolveGuardrailedText } from '@/lib/utils/guardrail';
import { BOOKING_URL } from '@/lib/site';
import type { SupervisorState, SupervisorDecision, AgentName } from '@/types/agent';
import type { InboundCaptureEvent, ConversationMessage, LeadContact } from '@/types/lead';

const SAFE_CHAT_FALLBACK =
  "I'd love to help — let me connect you with Adreanne directly. You can book a free call at " +
  BOOKING_URL;

export function createSession(): SupervisorState {
  return {
    sessionId: uuidv4(),
    currentAgent: 'conversation',
    completedAgents: [],
    context: {},
    guardrailViolations: [],
    humanHandoffRequired: false,
  };
}

/**
 * Handle a new inbound chat message within an existing session.
 */
export async function handleChatTurn(
  state: SupervisorState,
  userMessage: string
): Promise<{ state: SupervisorState; reply: string; bookingPrompt: boolean }> {
  const start = Date.now();
  const history = (state.context.history as ConversationMessage[]) ?? [];
  const capturedContact = (state.context.capturedContact as Record<string, string>) ?? {};

  // Run conversation agent
  const convoResult = await runConversationAgent({
    history,
    userMessage,
    sessionId: state.sessionId,
    capturedContact,
  });

  // Guardrail check on the chat reply before it reaches the user
  const guardrail = await runGuardrailCheck(convoResult.reply);
  const safeReply = resolveGuardrailedText(convoResult.reply, guardrail) ?? SAFE_CHAT_FALLBACK;
  const guardrailFlags = [
    ...(convoResult.shouldEscalate ? ['escalation'] : []),
    ...guardrail.flags,
  ];

  createAuditEntry({
    sessionId: state.sessionId,
    agent: 'conversation',
    inputSummary: `userMessage: ${userMessage.slice(0, 100)}`,
    outputSummary: `reply: ${safeReply.slice(0, 100)}`,
    startTime: start,
    guardrailFlags,
    humanReviewRequired: convoResult.shouldEscalate || guardrail.severity === 'block',
  });

  // Update state
  const nextState: SupervisorState = {
    ...state,
    context: {
      ...state.context,
      history: convoResult.updatedHistory,
      capturedContact: convoResult.capturedContact ?? capturedContact,
    },
    humanHandoffRequired: state.humanHandoffRequired || convoResult.shouldEscalate,
    handoffReason: convoResult.escalationReason,
  };

  // If contact captured → trigger qualification + CRM in background
  let bookingPrompt = false;
  if (convoResult.contactCaptured && !state.completedAgents.includes('qualification')) {
    bookingPrompt = true;
    // Qualification + CRM run after the reply is sent, so the chat stays fast.
    // This must go through after(), not a bare promise: the platform may freeze
    // the function as soon as the response is returned, which silently
    // discarded the HubSpot write and left chat leads nowhere at all. after()
    // keeps the function alive until the work finishes.
    after(() => runQualificationAndCRM(nextState));
    nextState.completedAgents = [...nextState.completedAgents, 'qualification', 'crm-action'];
  }

  return { state: nextState, reply: safeReply, bookingPrompt };
}

/**
 * Handle a full inbound capture event (form submit, open-house, etc.)
 */
export async function handleInboundEvent(
  event: InboundCaptureEvent
): Promise<{ sessionId: string; route: string; hubspotContactId: string }> {
  const state = createSession();
  const start = Date.now();

  // Qualify
  const qualification = await runQualificationAgent({
    conversationHistory: event.conversationHistory ?? [],
    capturedContact: event.contact,
    source: event.source,
    structuredFields: event.metadata,
  });

  createAuditEntry({
    sessionId: state.sessionId,
    agent: 'qualification',
    inputSummary: `source: ${event.source}`,
    outputSummary: `route: ${qualification.route}, score: ${qualification.totalScore}`,
    startTime: start,
    humanReviewRequired: qualification.handoffRequired,
  });

  // CRM
  const crmResult = await runCRMActionAgent({
    contact: event.contact,
    qualification,
    source: event.source,
    consent: event.consent,
    campaignMetadata: event.metadata,
  });

  createAuditEntry({
    sessionId: state.sessionId,
    agent: 'crm-action',
    inputSummary: `contactId: ${crmResult.hubspotContactId}`,
    outputSummary: `action: ${crmResult.action}, sequence: ${crmResult.enrolledInSequence}`,
    startTime: Date.now(),
  });

  // If hot lead → trigger immediate alert (stub — wire to Slack/email/SMS)
  if (qualification.route === 'hot') {
    await notifyAgentOfHotLead(crmResult.hubspotContactId, event.contact, qualification.totalScore);
  }

  return {
    sessionId: state.sessionId,
    route: qualification.route,
    hubspotContactId: crmResult.hubspotContactId,
  };
}

async function runQualificationAndCRM(state: SupervisorState): Promise<void> {
  const history = (state.context.history as ConversationMessage[]) ?? [];
  const capturedContact = (state.context.capturedContact as Record<string, string>) ?? {};

  try {
    const qualification = await runQualificationAgent({
      conversationHistory: history,
      capturedContact,
      source: 'website-chat',
    });

    const crmResult = await runCRMActionAgent({
      contact: capturedContact,
      qualification,
      source: 'website-chat',
      consent: { sms: false, email: true, dm: true },
    });

    // Every other intake path alerts on a hot lead; chat never did, so the
    // highest-intent visitors (the ones who talked to the bot) got no call.
    if (qualification.route === 'hot') {
      await notifyAgentOfHotLead(crmResult.hubspotContactId, capturedContact, qualification.totalScore)
        .catch((err) => console.error('[Supervisor] Chat hot-lead alert failed:', err));
    }
  } catch (err) {
    // The chat session is already marked qualified, so nothing retries this.
    // The contact details exist only in this function now; hand them to
    // Adreanne rather than losing the lead to a log line.
    console.error('[Supervisor] Chat lead failed to save:', err);
    const who = [capturedContact.firstName, capturedContact.lastName].filter(Boolean).join(' ') || 'Unknown name';
    await alertOwner(
      `⚠️ Chat lead NOT saved to HubSpot — add manually.\n${who}\n` +
        `${capturedContact.phone ?? ''} ${capturedContact.email ?? ''}\n` +
        `Reason: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function notifyAgentOfHotLead(
  contactId: string,
  contact: LeadContact,
  score: number
): Promise<void> {
  await notifyHotLead({
    name: `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'Unknown',
    phone: contact.phone,
    email: contact.email,
    intent: 'unknown',
    score,
    tags: [],
    source: 'website-chat',
    contactId,
  });
}

export function decide(state: SupervisorState): SupervisorDecision {
  if (state.humanHandoffRequired) {
    return {
      nextAgent: 'human',
      reason: state.handoffReason ?? 'Human handoff required',
      updatedState: state,
    };
  }

  const remaining: AgentName[] = (['conversation', 'qualification', 'crm-action', 'nurture'] as AgentName[]).filter(
    (a) => !state.completedAgents.includes(a)
  );

  if (remaining.length === 0) {
    return { nextAgent: 'done', reason: 'All agents complete', updatedState: state };
  }

  return {
    nextAgent: remaining[0],
    reason: 'Standard pipeline progression',
    updatedState: { ...state, currentAgent: remaining[0] },
  };
}
