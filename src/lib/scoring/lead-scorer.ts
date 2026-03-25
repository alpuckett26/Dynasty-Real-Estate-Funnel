import type { LeadFormData, LeadRoute, TimelineBucket, FinancingStatus } from '@/types/lead';

interface ScoringInput {
  timeline?: TimelineBucket;
  financingStatus?: FinancingStatus;
  hasArea?: boolean;
  hasBudget?: boolean;
  requestedShowing?: boolean;
  requestedPricingConsult?: boolean;
  respondedWithin24h?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  isPartner?: boolean;
}

interface ScoringResult {
  totalScore: number;
  motivationScore: number;
  urgencyScore: number;
  route: LeadRoute;
  breakdown: Record<string, number>;
}

const TIMELINE_SCORES: Record<TimelineBucket, number> = {
  '0-3m': 30,
  '3-6m': 20,
  '6-12m': 10,
  '12m+': 0,
  unknown: 0,
};

const FINANCING_SCORES: Record<FinancingStatus, number> = {
  'pre-approved': 20,
  cash: 20,
  'not-yet': 5,
  unknown: 0,
};

export function scoreLeadFromForm(data: LeadFormData): ScoringResult {
  return scoreLead({
    timeline: data.timeline,
    financingStatus: data.financingStatus,
    hasArea: !!data.areasOfInterest,
    hasBudget: !!(data.budgetMin || data.budgetMax),
    hasEmail: !!data.email,
    hasPhone: !!data.phone,
    isPartner: data.intent === 'partner',
  });
}

export function scoreLead(input: ScoringInput): ScoringResult {
  const breakdown: Record<string, number> = {};

  // Partner route → bypass score
  if (input.isPartner) {
    return {
      totalScore: 0,
      motivationScore: 0,
      urgencyScore: 0,
      route: 'partner',
      breakdown: { partner: 0 },
    };
  }

  // Timeline
  const timelineScore = TIMELINE_SCORES[input.timeline ?? 'unknown'];
  breakdown.timeline = timelineScore;

  // Financing
  const financingScore = FINANCING_SCORES[input.financingStatus ?? 'unknown'];
  breakdown.financing = financingScore;

  // Area + budget
  if (input.hasArea && input.hasBudget) {
    breakdown.areaAndBudget = 15;
  } else if (input.hasArea || input.hasBudget) {
    breakdown.areaOrBudget = 7;
  }

  // High-intent signals
  if (input.requestedShowing) {
    breakdown.requestedShowing = 20;
  }
  if (input.requestedPricingConsult) {
    breakdown.pricingConsult = 20;
  }

  // Response speed
  if (input.respondedWithin24h) {
    breakdown.responseSpeed = 10;
  }

  // Missing contact info penalty
  if (!input.hasEmail && !input.hasPhone) {
    breakdown.missingContact = -20;
  } else if (!input.hasEmail || !input.hasPhone) {
    breakdown.partialContact = -10;
  }

  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Sub-scores for CRM
  const urgencyScore = Math.min(
    100,
    Math.max(0, (breakdown.timeline ?? 0) + (breakdown.responseSpeed ?? 0) + (breakdown.requestedShowing ?? 0))
  );
  const motivationScore = Math.min(
    100,
    Math.max(0, (breakdown.financing ?? 0) + (breakdown.areaAndBudget ?? breakdown.areaOrBudget ?? 0) + (breakdown.pricingConsult ?? 0))
  );

  const route = classifyRoute(totalScore);

  return { totalScore, motivationScore, urgencyScore, route, breakdown };
}

function classifyRoute(score: number): LeadRoute {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export function getTaskDueDateMs(route: LeadRoute): number {
  const now = Date.now();
  switch (route) {
    case 'hot':
      return now + 30 * 60 * 1000; // 30 minutes
    case 'warm':
      return now + 24 * 60 * 60 * 1000; // 24 hours
    case 'cold':
      return now + 72 * 60 * 60 * 1000; // 72 hours
    default:
      return now + 7 * 24 * 60 * 60 * 1000; // 1 week
  }
}
