/**
 * CRM Action Agent
 *
 * Goal: idempotent upsert to HubSpot — contact, deal, note, task.
 * Rules: update existing record if email/phone match; else create new.
 */

import { upsertContact, createDeal, createNote, createTask } from '@/lib/hubspot/client';
import { getTaskDueDateMs } from '@/lib/scoring/lead-scorer';
import type { CRMActionAgentInput, CRMActionAgentOutput } from '@/types/agent';
import type { HubSpotContactProperties, PipelineStage } from '@/types/crm';

const PIPELINE_ID = process.env.HUBSPOT_PIPELINE_ID ?? 'default';

/**
 * HubSpot enum properties reject any value outside their option list, and the
 * casing is not consistent between properties — lead_type wants "Unknown"
 * while timeline wants "unknown". The qualification agent's values come from
 * an LLM, so they cannot be trusted to match exactly.
 *
 * A single bad value used to fail the whole upsert, and the catch below then
 * rewrote the contact with name and email only — silently discarding the
 * score, route, consent, and UTM attribution. These coerce case-insensitively
 * and fall back to the safe option instead.
 */
const LEAD_TYPE_OPTIONS = ['Unknown', 'Buyer', 'Seller', 'Partner', 'Both'] as const;
const TIMELINE_OPTIONS = ['0-3m', '3-6m', '6-12m', '12m+', 'unknown'] as const;
const LEAD_ROUTE_OPTIONS = ['Hot', 'Warm', 'Cold', 'Partner'] as const;
const FINANCING_OPTIONS = ['Pre-approved', 'Cash', 'Not yet', 'Unknown'] as const;
const CHANNEL_OPTIONS = [
  'ig-dm', 'messenger', 'website-chat', 'form', 'ads',
  'open-house', 'referral', 'call', 'unknown',
] as const;

/**
 * Pages pass a granular source ("buy-page", "homepage", "register-fthb") that
 * identifies the form, not the channel. None of those are valid
 * channel_source options, so every browser form submission used to fail the
 * upsert and fall back to name and email only. Map them to the channel they
 * actually are; the granular value is preserved on the contact note.
 */
const PAGE_SOURCES = new Set([
  'buy-page', 'get-ready', 'homepage', 'register-fthb',
  'relocate-page', 'sell-your-home', 'sell', 'credit-path',
]);

function toChannelSource(source: string): HubSpotContactProperties['channel_source'] {
  if (PAGE_SOURCES.has(source)) return 'form';
  return toEnum(source, CHANNEL_OPTIONS, 'form') as HubSpotContactProperties['channel_source'];
}

function toEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string' || !value) return fallback;
  const match = allowed.find((o) => o.toLowerCase() === value.trim().toLowerCase());
  return match ?? fallback;
}

/** HubSpot rejects non-numeric strings; only send a clean number or nothing. */
function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function stagFromRoute(
  route: string,
  leadType: string
): PipelineStage {
  if (route === 'hot') {
    if (leadType === 'seller') return 'qualified_seller';
    if (leadType === 'buyer') return 'qualified_buyer';
    if (leadType === 'both') return 'qualified_both';
  }
  return 'new_lead';
}

export async function runCRMActionAgent(
  input: CRMActionAgentInput
): Promise<CRMActionAgentOutput> {
  const { contact, qualification, source, consent, campaignMetadata } = input;

  // Build contact properties
  const contactProps: HubSpotContactProperties = {
    firstname: contact.firstName,
    lastname: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    lead_type: toEnum(qualification.leadType, LEAD_TYPE_OPTIONS, 'Unknown') as HubSpotContactProperties['lead_type'],
    areas_of_interest: Array.isArray(qualification.areasOfInterest)
      ? qualification.areasOfInterest.join(', ')
      : String(qualification.areasOfInterest ?? ''),
    budget_min: toNumber(qualification.budgetMin),
    budget_max: toNumber(qualification.budgetMax),
    timeline: toEnum(qualification.timelineBucket, TIMELINE_OPTIONS, 'unknown') as HubSpotContactProperties['timeline'],
    financing_status: toEnum(mapFinancing(qualification.financingStatus), FINANCING_OPTIONS, 'Unknown'),
    motivation_score: toNumber(qualification.motivationScore),
    urgency_score: toNumber(qualification.urgencyScore),
    total_lead_score: toNumber(qualification.totalScore),
    lead_route: toEnum(qualification.route, LEAD_ROUTE_OPTIONS, 'Cold') as HubSpotContactProperties['lead_route'],
    channel_source: toChannelSource(source),
    consent_sms: consent.sms,
    consent_email: consent.email,
    consent_dm: consent.dm,
    consent_timestamp: new Date().toISOString(),
    ai_conversation_summary: qualification.crmSummary,
    recommended_next_action: qualification.recommendedNextAction,
    handoff_reason: qualification.handoffReason,
    last_meaningful_interaction: new Date().toISOString(),
    utm_source: campaignMetadata?.utm_source,
    utm_medium: campaignMetadata?.utm_medium,
    utm_campaign: campaignMetadata?.utm_campaign,
  };

  // Upsert contact — fall back to standard props only if custom props aren't set up yet
  let contactId: string;
  let action: 'created' | 'updated';
  try {
    ({ contactId, action } = await upsertContact(contactProps));
  } catch (err) {
    // Losing the lead entirely is worse than losing its enrichment, so we still
    // retry — but keep the fields that drive follow-up and attribution, and make
    // the failure visible instead of swallowing it.
    console.error('[CRMActionAgent] Full upsert failed, retrying reduced:', err);
    const reducedProps: HubSpotContactProperties = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      consent_sms: consent.sms,
      consent_email: consent.email,
      consent_dm: consent.dm,
      consent_timestamp: new Date().toISOString(),
      last_meaningful_interaction: new Date().toISOString(),
      utm_source: campaignMetadata?.utm_source,
      utm_medium: campaignMetadata?.utm_medium,
      utm_campaign: campaignMetadata?.utm_campaign,
      ai_conversation_summary: `Enrichment failed to save — review manually. ${
        err instanceof Error ? err.message : String(err)
      }`.slice(0, 65000),
    };
    ({ contactId, action } = await upsertContact(reducedProps));
  }

  // Create deal for hot/warm leads (non-blocking)
  let dealId: string | undefined;
  if (qualification.route !== 'cold' && qualification.route !== 'partner') {
    try {
      const stage = stagFromRoute(qualification.route, qualification.leadType);
      const dealName = `${contact.firstName ?? 'Unknown'} ${contact.lastName ?? ''} — ${capitalise(qualification.leadType)} Lead`.trim();
      dealId = await createDeal(contactId, {
        dealname: dealName,
        dealstage: stage,
        pipeline: PIPELINE_ID,
      });
    } catch { /* deal creation optional */ }
  }

  // Create CRM note with AI summary (non-blocking)
  const noteBody = `
[AI SUMMARY — ${new Date().toLocaleDateString()}]
${qualification.crmSummary}

Scores: Total=${qualification.totalScore} | Urgency=${qualification.urgencyScore} | Motivation=${qualification.motivationScore}
Route: ${qualification.route.toUpperCase()}
Source: ${source}
${qualification.handoffRequired ? `\n⚠️ HANDOFF REQUIRED: ${qualification.handoffReason}` : ''}

Recommended Next Action: ${qualification.recommendedNextAction}
  `.trim();

  try { await createNote(contactId, noteBody); } catch { /* non-critical */ }

  // Create follow-up task (non-blocking)
  const taskLabel =
    qualification.route === 'hot'
      ? '🔥 HOT LEAD — Call immediately'
      : qualification.route === 'warm'
      ? 'Follow up with warm lead'
      : 'Add to nurture sequence';

  try {
    await createTask(contactId, {
      subject: taskLabel,
      body: `${qualification.recommendedNextAction}\n\nLead Score: ${qualification.totalScore}`,
      status: 'NOT_STARTED',
      taskType: 'CALL',
      dueDate: getTaskDueDateMs(qualification.route),
    });
  } catch { /* non-critical */ }

  return {
    hubspotContactId: contactId,
    hubspotDealId: dealId,
    action,
    taskCreated: true,
    enrolledInSequence:
      qualification.route === 'hot'
        ? 'hot-lead-sequence'
        : qualification.route === 'warm'
        ? 'warm-nurture-sequence'
        : 'cold-drip-sequence',
  };
}

function capitalise(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapFinancing(
  status: string
): HubSpotContactProperties['financing_status'] {
  const map: Record<string, HubSpotContactProperties['financing_status']> = {
    'pre-approved': 'Pre-approved',
    'not-yet': 'Not yet',
    cash: 'Cash',
    unknown: 'Unknown',
  };
  return map[status] ?? 'Unknown';
}
