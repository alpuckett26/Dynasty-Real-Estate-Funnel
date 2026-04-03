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
    lead_type: capitalise(qualification.leadType) as HubSpotContactProperties['lead_type'],
    areas_of_interest: qualification.areasOfInterest.join(', '),
    budget_min: qualification.budgetMin,
    budget_max: qualification.budgetMax,
    timeline: qualification.timelineBucket as HubSpotContactProperties['timeline'],
    financing_status: mapFinancing(qualification.financingStatus),
    motivation_score: qualification.motivationScore,
    urgency_score: qualification.urgencyScore,
    total_lead_score: qualification.totalScore,
    lead_route: capitalise(qualification.route) as HubSpotContactProperties['lead_route'],
    channel_source: source,
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
    const standardProps: HubSpotContactProperties = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    };
    ({ contactId, action } = await upsertContact(standardProps));
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
