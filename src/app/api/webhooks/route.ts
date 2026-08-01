/**
 * Inbound webhook handler for:
 * - ManyChat (IG DM / Messenger contact captured)
 * - CallRail (tracked call events)
 * - HubSpot (lifecycle stage changes)
 * - Open-house QR sign-in submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleInboundEvent } from '@/lib/agents/supervisor';
import { runNurtureAgent } from '@/lib/agents/nurture-agent';
import { enrollLead } from '@/lib/sequences/runner';
import { sendSMS } from '@/lib/sms/twilio';
import { sendEmail } from '@/lib/email/resend';
import { createHmac } from 'crypto';
import { BOOKING_URL } from '@/lib/site';
import { findContactByEmailOrPhone, createContact, updateContact } from '@/lib/hubspot/client';
import type { InboundCaptureEvent } from '@/types/lead';

function verifyHmacSignature(body: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // dev mode — skip verification
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

const ManyChatPayload = z.object({
  type: z.literal('manychat'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  channel: z.enum(['ig-dm', 'messenger']),
  conversationSummary: z.string().optional(),
  consentDm: z.boolean().default(true),
});

const CallRailPayload = z.object({
  type: z.literal('callrail'),
  callerName: z.string().optional(),
  callerNumber: z.string(),
  callDurationSeconds: z.number().optional(),
  trackingNumber: z.string().optional(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
});

const OpenHousePayload = z.object({
  type: z.literal('open_house'),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  eventId: z.string(),
  propertyAddress: z.string().optional(),
  consentSms: z.boolean().default(false),
  consentEmail: z.boolean().default(false),
});

const ReactivationPayload = z.object({
  type: z.literal('reactivation_batch'),
  contacts: z.array(
    z.object({
      contactId: z.string(),
      stage: z.string(),
      daysSinceLastInteraction: z.number(),
      leadRoute: z.string(),
      preferredChannel: z.enum(['email', 'sms']),
      consentEmail: z.boolean(),
      consentSms: z.boolean(),
      context: z.string().optional(),
    })
  ),
});

// Calendly fires this when an invitee books or cancels
const CalendlyPayload = z.object({
  type: z.literal('calendly'),
  event: z.enum(['invitee.created', 'invitee.canceled']),
  payload: z.object({
    invitee: z.object({
      name: z.string().optional(),
      email: z.string().email(),
    }),
    event_type: z.object({
      name: z.string().optional(),
    }).optional(),
  }),
});

const WebhookPayload = z.discriminatedUnion('type', [
  ManyChatPayload,
  CallRailPayload,
  OpenHousePayload,
  ReactivationPayload,
  CalendlyPayload,
]);

// ─── Calendly native format handler ──────────────────────────────────────────
// Calendly sends its own JSON structure (no `type` field) with a
// `Calendly-Webhook-Signature` header. We handle it before the generic Zod
// discriminated-union parse so we don't reject legitimate events.

const CalendlyNativePayload = z.object({
  event: z.string(), // 'invitee.created' | 'invitee.canceled'
  payload: z.object({
    event_type: z.object({ name: z.string().optional() }).optional(),
    event: z.object({ start_time: z.string().optional() }).optional(),
    invitee: z.object({
      name: z.string().optional(),
      email: z.string().email(),
    }),
  }),
});

async function handleCalendlyEvent(body: unknown): Promise<NextResponse> {
  const parsed = CalendlyNativePayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Calendly payload', details: parsed.error.errors }, { status: 400 });
  }

  const { event, payload } = parsed.data;
  const booked = event === 'invitee.created';
  const { name, email } = payload.invitee;
  const startTime = payload.event?.start_time;

  // Upsert contact — create if not yet in HubSpot
  let contactId = await findContactByEmailOrPhone(email);
  if (!contactId) {
    const nameParts = (name ?? '').split(' ');
    contactId = await createContact({
      firstName: nameParts[0] || undefined,
      lastName: nameParts.slice(1).join(' ') || undefined,
      email,
      source: 'calendly',
      channel_source: 'calendly',
      consent_sms: false,
      consent_email: true,
      lead_route: 'warm',
    } as never);
  }

  await updateContact(contactId, {
    consultation_status: booked ? 'Booked' : 'Canceled',
    last_meaningful_interaction: new Date().toISOString(),
  } as never);

  // Alert Adreanne via SMS
  if (booked) {
    const adreannePhone = process.env.ADREANNE_PHONE;
    if (adreannePhone) {
      const when = startTime
        ? new Date(startTime).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
        : 'time TBD';
      const displayName = name ?? email;
      sendSMS(
        adreannePhone,
        `📅 New consultation booked — ${displayName} (${email}) at ${when}. Check HubSpot for details.`
      ).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true, action: booked ? 'consultation_booked' : 'consultation_canceled', contactId });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Detect real Calendly webhooks by their header
  const isCalendly = req.headers.has('Calendly-Webhook-Signature') || req.headers.has('calendly-webhook-signature');

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (isCalendly) {
    return handleCalendlyEvent(body);
  }

  const signature = req.headers.get('x-webhook-signature') ?? '';
  if (!verifyHmacSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = WebhookPayload.parse(body);

    if (payload.type === 'manychat') {
      const event: InboundCaptureEvent = {
        type: 'manychat_trigger',
        source: payload.channel as InboundCaptureEvent['source'],
        contact: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        },
        conversationHistory: payload.conversationSummary
          ? [{ role: 'user', content: payload.conversationSummary, timestamp: new Date().toISOString() }]
          : [],
        consent: {
          sms: false,
          email: false,
          dm: payload.consentDm,
          timestamp: new Date().toISOString(),
        },
      };
      const result = await handleInboundEvent(event);
      return NextResponse.json({ ok: true, ...result });
    }

    if (payload.type === 'callrail') {
      const nameParts = (payload.callerName ?? '').split(' ');
      const event: InboundCaptureEvent = {
        type: 'call_event',
        source: 'call',
        contact: {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || undefined,
          phone: payload.callerNumber,
        },
        conversationHistory: [],
        consent: { sms: false, email: false, dm: false, timestamp: new Date().toISOString() },
        metadata: {
          utm_source: payload.utmSource ?? '',
          utm_campaign: payload.utmCampaign ?? '',
          tracking_number: payload.trackingNumber ?? '',
        },
      };
      const result = await handleInboundEvent(event);
      return NextResponse.json({ ok: true, ...result });
    }

    if (payload.type === 'open_house') {
      const event: InboundCaptureEvent = {
        type: 'open_house_signin',
        source: 'open-house',
        contact: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        },
        conversationHistory: [],
        consent: {
          sms: payload.consentSms,
          email: payload.consentEmail,
          dm: false,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          event_id: payload.eventId,
          property_address: payload.propertyAddress ?? '',
        },
      };
      const result = await handleInboundEvent(event);

      // Send immediate open house follow-up + enroll in buyer sequence
      const address = payload.propertyAddress ? ` at ${payload.propertyAddress}` : '';
      const calendlyUrl = BOOKING_URL;

      // These must be awaited. Fire-and-forget work is not safe here: the
      // platform may freeze the function as soon as the response is returned,
      // discarding the pending promise. That silently dropped the open-house
      // follow-up and the nurture enrollment for every sign-in.
      try {
        if (payload.consentSms && payload.phone) {
          await sendSMS(payload.phone, `Hi ${payload.firstName}! Thanks for visiting us today${address}. I'd love to answer any questions or schedule a private showing. Book a quick call here: ${calendlyUrl} — Adreanne Aranha, SMRG Real Estate`);
        } else if (payload.consentEmail && payload.email) {
          await sendEmail({
            to: payload.email,
            subject: `Thanks for visiting${address} today`,
            text: `Hi ${payload.firstName},\n\nThank you for stopping by today${address}. We hope you loved it!\n\nIf you have any questions or want to schedule a private showing, book a quick call here: ${calendlyUrl}\n\nWe'd love to help you find your perfect home.\n\n— Adreanne Aranha, SMRG Real Estate`,
          });
        }
      } catch (err) {
        console.error('[Webhooks] Open-house follow-up failed to send:', err);
      }

      // Enroll in buyer warm sequence for ongoing nurture
      try {
        await enrollLead({
          contactId: result.hubspotContactId,
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone,
          tags: ['Intent: Buyer', 'Lead Source: open-house'],
          consentEmail: payload.consentEmail,
          consentSms: payload.consentSms,
        });
      } catch (err) {
        console.error('[Webhooks] Open-house sequence enrollment failed:', err);
      }

      return NextResponse.json({ ok: true, ...result });
    }

    if (payload.type === 'reactivation_batch') {
      const results = await Promise.allSettled(
        payload.contacts.map(async (c) => {
          const result = await runNurtureAgent({
            contactId: c.contactId,
            currentStage: c.stage,
            daysSinceLastInteraction: c.daysSinceLastInteraction,
            leadRoute: c.leadRoute as 'hot' | 'warm' | 'cold',
            preferredChannel: c.preferredChannel,
            consent: { email: c.consentEmail, sms: c.consentSms, dm: false },
            context: c.context,
          });
          if (result.shouldSend && result.body) {
            if (result.channel === 'sms') {
              const phone = payload.contacts.find((x) => x.contactId === c.contactId);
              if (phone) await sendSMS(c.contactId, result.body).catch(console.error);
            } else if (result.channel === 'email' && result.body) {
              await sendEmail({ to: c.contactId, subject: result.subject ?? 'Checking in — Adreanne Aranha, SMRG Real Estate', text: result.body }).catch(console.error);
            }
          }
          return result;
        })
      );

      const summary = results.map((r, i) => ({
        contactId: payload.contacts[i].contactId,
        status: r.status,
        shouldSend: r.status === 'fulfilled' ? r.value.shouldSend : false,
      }));

      return NextResponse.json({ ok: true, processed: summary.length, summary });
    }

    if (payload.type === 'calendly') {
      const email = payload.payload.invitee.email;
      const booked = payload.event === 'invitee.created';

      const contactId = await findContactByEmailOrPhone(email);
      if (contactId) {
        await updateContact(contactId, {
          consultation_status: booked ? 'Booked' : 'Not Booked',
          last_meaningful_interaction: new Date().toISOString(),
        });
      }

      return NextResponse.json({ ok: true, action: booked ? 'consultation_booked' : 'consultation_canceled', contactId });
    }

    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: err.errors }, { status: 400 });
    }
    console.error('[WebhookAPI]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
