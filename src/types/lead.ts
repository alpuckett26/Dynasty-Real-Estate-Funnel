export type LeadType = 'buyer' | 'seller' | 'both' | 'partner' | 'unknown';

export type TimelineBucket =
  | '0-3m'
  | '3-6m'
  | '6-12m'
  | '12m+'
  | 'unknown';

export type FinancingStatus =
  | 'pre-approved'
  | 'need-lender'
  | 'need-dpa'
  | 'need-credit-repair'
  | 'not-yet'
  | 'cash'
  | 'unknown';

export type ContactPreference = 'call' | 'text' | 'email';

export type IntakeTimeline =
  | 'now'
  | '30-60d'
  | '3-6m'
  | '6m+'
  | 'researching';

export type LeadRoute = 'hot' | 'warm' | 'cold' | 'partner';

export type ChannelSource =
  | 'ig-dm'
  | 'messenger'
  | 'website-chat'
  | 'form'
  | 'ads'
  | 'open-house'
  | 'referral'
  | 'call'
  | 'unknown';

export type ConsentType = 'sms' | 'email' | 'dm';

export interface LeadConsent {
  sms: boolean;
  email: boolean;
  dm: boolean;
  timestamp: string;
  ip?: string;
}

export interface LeadContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface LeadQualification {
  leadType: LeadType;
  timelineBucket: TimelineBucket;
  financingStatus: FinancingStatus;
  areasOfInterest: string[];
  budgetMin?: number;
  budgetMax?: number;
  motivationScore: number;   // 0–100
  urgencyScore: number;      // 0–100
  totalScore: number;        // computed composite
  route: LeadRoute;
  handoffRequired: boolean;
  handoffReason?: string;
  crmSummary: string;
  recommendedNextAction: string;
}

export interface Lead {
  id: string;
  contact: LeadContact;
  qualification: LeadQualification;
  source: ChannelSource;
  consent: LeadConsent;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
  updatedAt: string;
  hubspotContactId?: string;
  hubspotDealId?: string;
}

export interface InboundCaptureEvent {
  type:
    | 'form_submit'
    | 'chat_contact_captured'
    | 'manychat_trigger'
    | 'open_house_signin'
    | 'call_event';
  source: ChannelSource;
  contact: LeadContact;
  conversationHistory?: ConversationMessage[];
  consent: LeadConsent;
  metadata?: Record<string, string>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  intent: LeadType;
  areasOfInterest: string;
  timeline: TimelineBucket;
  financingStatus: FinancingStatus;
  budgetMin?: number;
  budgetMax?: number;
  message?: string;
  consentSms: boolean;
  consentEmail: boolean;
  source: ChannelSource;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/** Extended intake form — used for landing page funnels */
export interface IntakeFormData {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactPreference: ContactPreference;

  // Intent
  intent: LeadType;
  firstTimeHomebuyer: boolean;
  healthcareWorker: boolean;

  // Location + timeline
  areasOfInterest: string;
  timeline: IntakeTimeline;

  // Financial readiness
  financingStatus: FinancingStatus;

  // Buyer details
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: string;
  leaseExpiration?: string;
  needToSellFirst: boolean;

  // Seller details
  needsValuation: boolean;
  alreadyListed: boolean;
  propertyAddress?: string;
  buyingAfterSelling: boolean;

  // Consent + source
  consentSms: boolean;
  consentEmail: boolean;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Derived tags (set server-side)
  tags?: string[];
}
