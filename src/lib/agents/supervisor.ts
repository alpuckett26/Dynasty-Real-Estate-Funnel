/**
 * Supervisor / Orchestrator
 *
 * Decides which agent runs next.
 * Enforces guardrails and handoff rules.
 * Maintains session state throughout the funnel.
 */

import { v4 as uuidv4 } from 'uuid';
import { runConversationAgent } from './conversation-agent';
import { runQualificationAgent } from './qualification-agent';
import { runCRMActionAgent } from './crm-action-agent';
import { runNurtureAgent } from './nurture-agent';
import { createAuditEntry } from '@/lib/utils/audit';
import type { SupervisorState, SupervisorDecision, AgentName } from '@/types/agent';
import type { InboundCaptureEvent, ConversationMessage, LeadContact } from '@/types/lead';

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

  createAuditEntry({
    sessionId: state.sessionId,
    agent: 'conversation',
    inputSummary: `userMessage: ${userMessage.slice(0, 100)}`,
    outputSummary: `reply: ${convoResult.reply.slice(0, 100)}`,
    startTime: start,
    guardrailFlags: convoResult.shouldEscalate ? ['escalation'] : [],
    humanReviewRequired: convoResult.shouldEscalate,
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
    // Fire-and-forget qualification + CRM (non-blocking for chat UX)
    runQualificationAndCRM(nextState).catch(console.error);
    nextState.completedAgents = [...nextState.completedAgents, 'qualification', 'crm-action'];
  }

  return { state: nextState, reply: convoResult.reply, bookingPrompt };
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

  const qualification = await runQualificationAgent({
    conversationHistory: history,
    capturedContact,
    source: 'website-chat',
  });

  await runCRMActionAgent({
    contact: capturedContact,
    qualification,
    source: 'website-chat',
    consent: { sms: false, email: true, dm: true },
  });
}

async function notifyAgentOfHotLead(
  contactId: string,
  contact: LeadContact,
  score: number
): Promise<void> {
  // TODO: Wire to Slack webhook, email alert, or SMS via Twilio
  console.log('[HOT LEAD ALERT]', { contactId, contact, score });
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
