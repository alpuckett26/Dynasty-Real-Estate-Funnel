export type LeadType = 'buyer' | 'seller' | 'both' | 'partner' | 'unknown';

export type TimelineBucket =
  | '0-3m'
  | '3-6m'
  | '6-12m'
  | '12m+'
  | 'unknown';

export type FinancingStatus =
  | 'pre-approved'
  | 'not-yet'
  | 'cash'
  | 'unknown';

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
