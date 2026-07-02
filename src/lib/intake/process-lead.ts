/**
 * Shared lead-intake pipeline.
 *
 * One entry point for EVERY lead source — website forms, Meta Lead Ads,
 * Zapier, portal email parsers. Scores the lead, upserts to HubSpot,
 * writes a note + follow-up task, fires hot-lead alerts, and enrolls
 * the contact in the matching nurture sequence (step 0 sends instantly).
 */

import { z } from 'zod';
import { upsertContact, createNote, createTask } from '@/lib/hubspot/client';
import { notifyHotLead } from '@/lib/notifications/slack';
import { enrollLead } from '@/lib/sequences/runner';
import { scoreLead, getTaskDueDateMs } from '@/lib/scoring/lead-scorer';
import type { HubSpotContactProperties, PipelineStage } from '@/types/crm';

export const IntakeLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).optional().or(z.literal('')),
  contactPreference: z.enum(['call', 'text', 'email']).default('call'),
  intent: z.enum(['buyer', 'seller', 'both', 'unknown']).default('unknown'),
  firstTimeHomebuyer: z.boolean().default(false),
  healthcareWorker: z.boolean().default(false),
  areasOfInterest: z.string().optional(),
  timeline: z.enum(['now', '30-60d', '3-6m', '6m+', 'researching']).default('researching'),
  financingStatus: z.enum(['pre-approved', 'need-lender', 'need-dpa', 'need-credit-repair', 'unsure']).default('unsure'),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  bedrooms: z.string().optional(),
  leaseExpiration: z.string().optional(),
  needToSellFirst: z.boolean().default(false),
  needsValuation: z.boolean().default(false),
  alreadyListed: z.boolean().default(false),
  propertyAddress: z.string().optional(),
  buyingAfterSelling: z.boolean().default(false),
  consentSms: z.boolean().default(false),
  consentEmail: z.boolean().default(false),
  source: z.string().default('intake-form'),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type IntakeLead = z.infer<typeof IntakeLeadSchema>;

export interface ProcessedLeadResult {
  contactId: string;
  route: 'hot' | 'warm' | 'cold' | 'partner';
  stage: PipelineStage;
  tags: string[];
  totalScore: number;
}

export async function processIntakeLead(data: IntakeLead): Promise<ProcessedLeadResult> {
  if (!data.email && !data.phone) {
    throw new Error('Lead must include at least an email or phone number');
  }

  const tags = buildTags(data);

  const timelineBucket = mapTimeline(data.timeline);
  const financingBucket = mapFinancing(data.financingStatus);

  const scoreResult = scoreLead({
    timeline: timelineBucket,
    financingStatus: financingBucket,
    hasArea: !!data.areasOfInterest,
    hasBudget: !!(data.budgetMin || data.budgetMax),
    hasEmail: !!data.email,
    hasPhone: !!data.phone,
    isPartner: false,
  });

  const stage = mapStage(data.financingStatus, data.intent, scoreResult.route);

  const contactProps: HubSpotContactProperties = {
    firstname: data.firstName,
    lastname: data.lastName,
    email: data.email || undefined,
    phone: data.phone || undefined,
    lead_type: capitalise(data.intent) as HubSpotContactProperties['lead_type'],
    areas_of_interest: data.areasOfInterest,
    budget_min: data.budgetMin,
    budget_max: data.budgetMax,
    timeline: timelineBucket,
    financing_status: mapFinancingLabel(data.financingStatus),
    motivation_score: scoreResult.motivationScore,
    urgency_score: scoreResult.urgencyScore,
    total_lead_score: scoreResult.totalScore,
    lead_route: capitalise(scoreResult.route) as HubSpotContactProperties['lead_route'],
    channel_source: normalizeSource(data.source),
    first_time_homebuyer: data.firstTimeHomebuyer,
    healthcare_worker: data.healthcareWorker,
    program_type: buildProgramType(data),
    contact_preference: capitalise(data.contactPreference) as HubSpotContactProperties['contact_preference'],
    needs_credit_repair: data.financingStatus === 'need-credit-repair',
    needs_lender_referral: data.financingStatus === 'need-lender',
    needs_dpa: data.financingStatus === 'need-dpa',
    need_to_sell_first: data.needToSellFirst,
    bedrooms_desired: data.bedrooms,
    lease_expiration: data.leaseExpiration,
    property_address: data.propertyAddress,
    already_listed: data.alreadyListed,
    buying_after_selling: data.buyingAfterSelling,
    consultation_status: 'Not Booked',
    consent_sms: data.consentSms,
    consent_email: data.consentEmail,
    consent_timestamp: new Date().toISOString(),
    last_meaningful_interaction: new Date().toISOString(),
    utm_source: data.utmSource,
    utm_medium: data.utmMedium,
    utm_campaign: data.utmCampaign,
  };

  const { contactId } = await upsertContact(contactProps);

  // CRM note (non-blocking)
  const noteLines = [
    `[INTAKE — ${new Date().toLocaleDateString()}]`,
    `Intent: ${data.intent} | Route: ${scoreResult.route.toUpperCase()} | Score: ${scoreResult.totalScore}`,
    `Timeline: ${data.timeline} | Financing: ${data.financingStatus}`,
    tags.length ? `Tags: ${tags.join(', ')}` : '',
    data.areasOfInterest ? `Areas: ${data.areasOfInterest}` : '',
    data.propertyAddress ? `Property: ${data.propertyAddress}` : '',
    `Source: ${data.source}${data.utmSource ? ` / ${data.utmSource}` : ''}`,
    `Stage: ${stage}`,
  ].filter(Boolean).join('\n');

  createNote(contactId, noteLines).catch((e) => console.error('[Intake] note failed:', e?.message));

  // Follow-up task (non-blocking)
  createTask(contactId, {
    subject: buildTaskSubject(scoreResult.route, data),
    body: buildTaskBody(data, scoreResult.totalScore, stage),
    status: 'NOT_STARTED',
    taskType: data.contactPreference === 'email' ? 'EMAIL' : 'CALL',
    dueDate: getTaskDueDateMs(scoreResult.route),
  }).catch((e) => console.error('[Intake] task failed:', e?.message));

  // Hot lead alert (Slack + SMS to Adreanne)
  if (scoreResult.route === 'hot') {
    notifyHotLead({
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      email: data.email,
      intent: data.intent,
      score: scoreResult.totalScore,
      tags,
      source: data.source,
      contactId,
    }).catch(console.error);
  }

  // Enroll in nurture sequence (step 0 fires instantly)
  await enrollLead({
    contactId,
    firstName: data.firstName,
    email: data.email || undefined,
    phone: data.phone || undefined,
    tags,
    consentEmail: data.consentEmail,
    consentSms: data.consentSms,
  }).catch(console.error);

  return {
    contactId,
    route: scoreResult.route,
    stage,
    tags,
    totalScore: scoreResult.totalScore,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTags(data: IntakeLead): string[] {
  const tags: string[] = [];

  if (data.utmSource) tags.push(`Lead Source: ${data.utmSource}`);
  else tags.push(`Lead Source: ${data.source}`);

  if (data.firstTimeHomebuyer) tags.push('Program: First Time Homebuyer');
  if (data.healthcareWorker) tags.push('Program: Healthcare Worker');

  const intentMap: Record<string, string> = {
    buyer: 'Intent: Buyer',
    seller: 'Intent: Seller',
    both: 'Intent: Both',
  };
  if (intentMap[data.intent]) tags.push(intentMap[data.intent]);

  const timelineMap: Record<string, string> = {
    now: 'Timeline: Now',
    '30-60d': 'Timeline: 30-60 Days',
    '3-6m': 'Timeline: 3-6 Months',
    '6m+': 'Timeline: 6+ Months',
    researching: 'Timeline: Researching',
  };
  tags.push(timelineMap[data.timeline] ?? 'Timeline: Unknown');

  if (data.financingStatus === 'need-credit-repair') tags.push('Needs: Credit Repair');
  if (data.financingStatus === 'need-lender') tags.push('Needs: Lender Referral');
  if (data.financingStatus === 'need-dpa') tags.push('Needs: Down Payment Assistance');
  if (data.financingStatus === 'pre-approved') tags.push('Financing: Pre-Approved');

  tags.push('Status: Consultation Not Booked');

  return tags;
}

function buildProgramType(data: IntakeLead): string {
  if (data.firstTimeHomebuyer && data.healthcareWorker) return 'First Time Homebuyer, Healthcare Worker';
  if (data.firstTimeHomebuyer) return 'First Time Homebuyer';
  if (data.healthcareWorker) return 'Healthcare Worker';
  return 'Standard';
}

function mapTimeline(t: string): HubSpotContactProperties['timeline'] {
  const map: Record<string, HubSpotContactProperties['timeline']> = {
    now: '0-3m',
    '30-60d': '0-3m',
    '3-6m': '3-6m',
    '6m+': '6-12m',
    researching: '12m+',
  };
  return map[t] ?? '12m+';
}

function mapFinancing(f: string): Parameters<typeof scoreLead>[0]['financingStatus'] {
  if (f === 'pre-approved') return 'pre-approved';
  if (f === 'need-credit-repair' || f === 'need-lender' || f === 'need-dpa' || f === 'unsure') return 'not-yet';
  return 'unknown';
}

function mapFinancingLabel(f: string): HubSpotContactProperties['financing_status'] {
  const map: Record<string, HubSpotContactProperties['financing_status']> = {
    'pre-approved': 'Pre-approved',
    'need-lender': 'Needs Lender',
    'need-dpa': 'Needs DPA',
    'need-credit-repair': 'Needs Credit Repair',
    unsure: 'Unknown',
  };
  return map[f] ?? 'Unknown';
}

function mapStage(financing: string, intent: string, route: string): PipelineStage {
  if (financing === 'need-credit-repair') return 'needs_credit_repair';
  if (financing === 'need-lender' || financing === 'need-dpa') return 'needs_lender';
  if (route === 'hot') {
    if (intent === 'seller') return 'seller_active';
    if (intent === 'buyer') return 'buyer_active';
    return 'consultation_not_booked';
  }
  return 'registered';
}

function buildTaskSubject(route: string, data: IntakeLead): string {
  const name = `${data.firstName} ${data.lastName}`;
  if (route === 'hot') return `🔥 HOT LEAD — ${data.contactPreference === 'email' ? 'Email' : 'Call'} immediately: ${name}`;
  if (route === 'warm') return `📞 Follow up: ${name} (${capitalise(data.intent)})`;
  return `📋 Add to nurture: ${name}`;
}

function buildTaskBody(data: IntakeLead, score: number, stage: string): string {
  const lines = [
    `Intent: ${data.intent} | Score: ${score} | Stage: ${stage}`,
    `Preferred contact: ${data.contactPreference}`,
    data.phone ? `Phone: ${data.phone}` : '',
    data.email ? `Email: ${data.email}` : '',
    data.areasOfInterest ? `Areas: ${data.areasOfInterest}` : '',
    data.financingStatus !== 'unsure' ? `Financing: ${data.financingStatus}` : '',
    data.firstTimeHomebuyer ? '✅ First-time homebuyer' : '',
    data.healthcareWorker ? '✅ Healthcare worker' : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function normalizeSource(source: string): HubSpotContactProperties['channel_source'] {
  if (source.includes('open-house')) return 'open-house';
  if (source.includes('meta') || source.includes('ads') || source.includes('ad')) return 'ads';
  if (source.includes('referral')) return 'referral';
  if (source.includes('call')) return 'call';
  if (source.includes('ig') || source.includes('instagram')) return 'ig-dm';
  if (source.includes('messenger') || source.includes('facebook')) return 'messenger';
  if (source.includes('chat')) return 'website-chat';
  return 'form';
}

function capitalise(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
