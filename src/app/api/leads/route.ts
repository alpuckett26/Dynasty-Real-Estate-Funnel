import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleInboundEvent } from '@/lib/agents/supervisor';
import { scoreLeadFromForm } from '@/lib/scoring/lead-scorer';
import { enrollLead } from '@/lib/sequences/runner';
import { BOOKING_URL } from '@/lib/site';
import type { InboundCaptureEvent } from '@/types/lead';

const LeadSubmitSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).optional().or(z.literal('')),
  intent: z.enum(['buyer', 'seller', 'both', 'partner', 'unknown']).default('unknown'),
  areasOfInterest: z.string().optional(),
  timeline: z.enum(['0-3m', '3-6m', '6-12m', '12m+', 'unknown']).default('unknown'),
  financingStatus: z.enum(['pre-approved', 'not-yet', 'cash', 'unknown']).default('unknown'),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  message: z.string().max(2000).optional(),
  consentSms: z.boolean().default(false),
  consentEmail: z.boolean().default(false),
  source: z.string().default('form'),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = LeadSubmitSchema.parse(body);

    // Basic contact validation — need at least email or phone
    if (!data.email && !data.phone) {
      return NextResponse.json(
        { error: 'Please provide at least an email or phone number.' },
        { status: 400 }
      );
    }

    const event: InboundCaptureEvent = {
      type: 'form_submit',
      source: data.source as InboundCaptureEvent['source'],
      contact: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
      },
      conversationHistory: data.message
        ? [{ role: 'user', content: data.message, timestamp: new Date().toISOString() }]
        : [],
      consent: {
        sms: data.consentSms,
        email: data.consentEmail,
        dm: false,
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') ?? undefined,
      },
      metadata: {
        intent: data.intent,
        timeline: data.timeline,
        financingStatus: data.financingStatus,
        areasOfInterest: data.areasOfInterest ?? '',
        budgetMin: String(data.budgetMin ?? ''),
        budgetMax: String(data.budgetMax ?? ''),
        utm_source: data.utmSource ?? '',
        utm_medium: data.utmMedium ?? '',
        utm_campaign: data.utmCampaign ?? '',
      },
    };

    const result = await handleInboundEvent(event);

    // Score for immediate response customisation
    const score = scoreLeadFromForm({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? '',
      phone: data.phone ?? '',
      intent: data.intent,
      areasOfInterest: data.areasOfInterest ?? '',
      timeline: data.timeline,
      financingStatus: data.financingStatus,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      message: data.message,
      consentSms: data.consentSms,
      consentEmail: data.consentEmail,
      source: data.source as 'form',
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    });

    // ── Enroll in nurture sequence ────────────────────────────────────────────
    enrollLead({
      contactId: result.hubspotContactId,
      firstName: data.firstName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      tags: [`Intent: ${capitalise(data.intent)}`, `Lead Source: ${data.source}`],
      consentEmail: data.consentEmail,
      consentSms: data.consentSms,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      route: result.route,
      message:
        score.route === 'hot'
          ? "We've received your info and an agent will call you within 5 minutes!"
          : "Thanks! We'll be in touch soon with next steps.",
      bookingUrl: BOOKING_URL,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data', details: err.errors }, { status: 400 });
    }
    console.error('[LeadsAPI]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

function capitalise(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
