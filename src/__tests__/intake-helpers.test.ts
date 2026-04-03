/**
 * Tests for the helper logic inside /api/intake/route.ts.
 * We extract the pure functions here rather than hitting the HTTP route,
 * so these run with zero external dependencies.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ── Replicated helpers (mirrors src/app/api/intake/route.ts exactly) ──────────

const IntakeSchema = z.object({
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

type IntakeData = z.infer<typeof IntakeSchema>;

function normalizeSource(source: string): string {
  if (source.includes('open-house')) return 'open-house';
  if (source.includes('ads') || source.includes('ad')) return 'ads';
  if (source.includes('referral')) return 'referral';
  if (source.includes('call')) return 'call';
  if (source.includes('ig') || source.includes('instagram')) return 'ig-dm';
  if (source.includes('messenger') || source.includes('facebook')) return 'messenger';
  if (source.includes('chat')) return 'website-chat';
  return 'form';
}

function buildProgramType(data: IntakeData): string {
  if (data.firstTimeHomebuyer && data.healthcareWorker) return 'First Time Homebuyer, Healthcare Worker';
  if (data.firstTimeHomebuyer) return 'First Time Homebuyer';
  if (data.healthcareWorker) return 'Healthcare Worker';
  return 'Standard';
}

function mapTimeline(t: string): string {
  const map: Record<string, string> = {
    now: '0-3m',
    '30-60d': '0-3m',
    '3-6m': '3-6m',
    '6m+': '6-12m',
    researching: '12m+',
  };
  return map[t] ?? '12m+';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IntakeSchema validation', () => {
  it('accepts a minimal valid payload (phone only)', () => {
    const result = IntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '2251234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing first/last name', () => {
    expect(IntakeSchema.safeParse({ phone: '2251234567' }).success).toBe(false);
    expect(IntakeSchema.safeParse({ firstName: 'Jane', phone: '2251234567' }).success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    const result = IntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty string for email (treated as no email)', () => {
    const result = IntakeSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('applies default values for optional fields', () => {
    const result = IntakeSchema.safeParse({ firstName: 'Jane', lastName: 'Doe', phone: '2251234567' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeline).toBe('researching');
      expect(result.data.financingStatus).toBe('unsure');
      expect(result.data.intent).toBe('unknown');
      expect(result.data.consentSms).toBe(false);
    }
  });
});

describe('normalizeSource', () => {
  it('maps open-house variants', () => {
    expect(normalizeSource('open-house')).toBe('open-house');
    expect(normalizeSource('open-house-2024')).toBe('open-house');
  });

  it('maps ad/ads variants', () => {
    expect(normalizeSource('facebook-ads')).toBe('ads');
    expect(normalizeSource('google-ad')).toBe('ads');
  });

  it('maps Instagram variants', () => {
    expect(normalizeSource('ig-dm')).toBe('ig-dm');
    expect(normalizeSource('instagram')).toBe('ig-dm');
  });

  it('maps Messenger/Facebook', () => {
    expect(normalizeSource('messenger')).toBe('messenger');
    expect(normalizeSource('facebook')).toBe('messenger');
  });

  it('maps referral', () => {
    expect(normalizeSource('referral-partner')).toBe('referral');
  });

  it('maps call', () => {
    expect(normalizeSource('call')).toBe('call');
  });

  it('maps chat', () => {
    expect(normalizeSource('website-chat')).toBe('website-chat');
  });

  it('falls back to form for unknown sources', () => {
    expect(normalizeSource('register-fthb')).toBe('form');
    expect(normalizeSource('unknown-source')).toBe('form');
    expect(normalizeSource('')).toBe('form');
  });
});

describe('buildProgramType', () => {
  const base: IntakeData = IntakeSchema.parse({ firstName: 'J', lastName: 'D', phone: '2251234567' });

  it('standard when neither flag is set', () => {
    expect(buildProgramType(base)).toBe('Standard');
  });

  it('First Time Homebuyer when only FTHB', () => {
    expect(buildProgramType({ ...base, firstTimeHomebuyer: true })).toBe('First Time Homebuyer');
  });

  it('Healthcare Worker when only healthcare', () => {
    expect(buildProgramType({ ...base, healthcareWorker: true })).toBe('Healthcare Worker');
  });

  it('combined when both flags are set', () => {
    expect(buildProgramType({ ...base, firstTimeHomebuyer: true, healthcareWorker: true })).toBe('First Time Homebuyer, Healthcare Worker');
  });
});

describe('mapTimeline', () => {
  it('maps now and 30-60d to 0-3m', () => {
    expect(mapTimeline('now')).toBe('0-3m');
    expect(mapTimeline('30-60d')).toBe('0-3m');
  });

  it('maps 3-6m correctly', () => {
    expect(mapTimeline('3-6m')).toBe('3-6m');
  });

  it('maps 6m+ to 6-12m', () => {
    expect(mapTimeline('6m+')).toBe('6-12m');
  });

  it('maps researching to 12m+', () => {
    expect(mapTimeline('researching')).toBe('12m+');
  });

  it('defaults to 12m+ for unknown values', () => {
    expect(mapTimeline('someday')).toBe('12m+');
  });
});
