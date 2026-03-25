// HubSpot pipeline stages (in order)
export const PIPELINE_STAGES = [
  'new_lead',
  'attempted_contact',
  'qualified_buyer',
  'qualified_seller',
  'qualified_both',
  'appointment_scheduled',
  'consultation_complete',
  'active_client',
  'under_contract',
  'closed_won',
  'closed_lost',
  'nurture_long_term',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Custom HubSpot contact properties required by this system
export interface HubSpotContactProperties {
  // Standard
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;

  // Custom – Lead Intelligence
  lead_type?: 'Buyer' | 'Seller' | 'Both' | 'Partner';
  areas_of_interest?: string;
  budget_min?: number;
  budget_max?: number;
  timeline?: '0-3m' | '3-6m' | '6-12m' | '12m+';
  financing_status?: 'Pre-approved' | 'Not yet' | 'Cash' | 'Unknown';
  motivation_score?: number;
  urgency_score?: number;
  total_lead_score?: number;
  lead_route?: 'Hot' | 'Warm' | 'Cold' | 'Partner';

  // Custom – Channel
  channel_source?: string;

  // Custom – Consent
  consent_sms?: boolean;
  consent_email?: boolean;
  consent_dm?: boolean;
  consent_timestamp?: string;

  // Custom – AI Outputs
  ai_conversation_summary?: string;
  recommended_next_action?: string;
  handoff_reason?: string;

  // Custom – Lifecycle
  last_meaningful_interaction?: string;
  reactivation_segment?: 'dormant_30' | 'dormant_60' | 'dormant_90' | 'none';

  // UTM
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface HubSpotDealProperties {
  dealname: string;
  dealstage: PipelineStage;
  pipeline: string;
  closedate?: string;
  amount?: number;
  hubspot_owner_id?: string;
}

export interface HubSpotTask {
  subject: string;
  body: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  taskType: 'CALL' | 'EMAIL' | 'TODO';
  dueDate: number; // Unix ms
  ownerId?: string;
}

export interface CRMRecord {
  contactId: string;
  dealId?: string;
  properties: HubSpotContactProperties;
  stage: PipelineStage;
  tasks: HubSpotTask[];
}

// Reactivation segments
export type ReactivationSegment =
  | 'dormant_30'  // 30-60 days since last interaction
  | 'dormant_60'  // 60-90 days
  | 'dormant_90'  // 90+ days
  | 'none';

export interface ReactivationContact {
  hubspotContactId: string;
  name: string;
  email?: string;
  phone?: string;
  segment: ReactivationSegment;
  leadType: string;
  lastInteraction: string;
  preferredChannel: 'email' | 'sms';
}
