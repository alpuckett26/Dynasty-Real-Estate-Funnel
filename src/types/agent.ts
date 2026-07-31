import type { LeadQualification, ConversationMessage, LeadContact } from './lead';

// ─── Conversation Agent ────────────────────────────────────────────────────────

export interface ConversationAgentInput {
  history: ConversationMessage[];
  userMessage: string;
  sessionId: string;
  capturedContact?: Partial<LeadContact>;
}

export interface ConversationAgentOutput {
  reply: string;
  updatedHistory: ConversationMessage[];
  contactCaptured: boolean;
  capturedContact?: Partial<LeadContact>;
  shouldEscalate: boolean;
  escalationReason?: string;
  sessionId: string;
}

// ─── Qualification Agent ───────────────────────────────────────────────────────

export interface QualificationAgentInput {
  conversationHistory: ConversationMessage[];
  capturedContact: Partial<LeadContact>;
  source: string;
  /**
   * Structured fields captured directly by a form. Used to qualify the lead
   * deterministically when the LLM is unavailable, so a provider outage never
   * costs us the lead.
   */
  structuredFields?: Record<string, string>;
}

export interface QualificationAgentOutput extends LeadQualification {
  rawResponse?: string;
}

// ─── CRM Action Agent ─────────────────────────────────────────────────────────

export interface CRMActionAgentInput {
  contact: LeadContact;
  qualification: LeadQualification;
  source: string;
  consent: {
    sms: boolean;
    email: boolean;
    dm: boolean;
  };
  campaignMetadata?: Record<string, string>;
}

export interface CRMActionAgentOutput {
  hubspotContactId: string;
  hubspotDealId?: string;
  action: 'created' | 'updated';
  taskCreated: boolean;
  enrolledInSequence?: string;
}

// ─── Nurture / Reactivation Agent ────────────────────────────────────────────

export interface NurtureAgentInput {
  contactId: string;
  currentStage: string;
  daysSinceLastInteraction: number;
  leadRoute: string;
  preferredChannel: 'email' | 'sms' | 'dm';
  consent: Record<string, boolean>;
  context?: string;
}

export interface NurtureAgentOutput {
  shouldSend: boolean;
  channel: 'email' | 'sms' | 'dm' | 'none';
  subject?: string;
  body: string;
  scheduledFor?: string;
  sequenceId?: string;
}

// ─── Content Agent ────────────────────────────────────────────────────────────

export interface ContentAgentInput {
  type: 'social' | 'email' | 'ad';
  context: string;
  tone?: 'professional' | 'friendly' | 'urgent';
  includeListings?: boolean;
  targetAudience?: string;
}

export interface ContentAgentOutput {
  content: string;
  headline?: string;
  cta?: string;
  hashtags?: string[];
  variants?: string[];
}

// ─── Supervisor / Orchestrator ────────────────────────────────────────────────

export type AgentName =
  | 'conversation'
  | 'qualification'
  | 'crm-action'
  | 'nurture'
  | 'content'
  | 'reputation';

export interface SupervisorState {
  sessionId: string;
  currentAgent: AgentName;
  completedAgents: AgentName[];
  context: Record<string, unknown>;
  guardrailViolations: string[];
  humanHandoffRequired: boolean;
  handoffReason?: string;
}

export interface SupervisorDecision {
  nextAgent: AgentName | 'human' | 'done';
  reason: string;
  updatedState: SupervisorState;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  sessionId: string;
  agent: AgentName | 'supervisor';
  inputSummary: string;
  outputSummary: string;
  timestamp: string;
  durationMs: number;
  guardrailFlags: string[];
  humanReviewRequired: boolean;
}
