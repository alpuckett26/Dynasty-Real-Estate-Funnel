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
import { createHmac } from 'crypto';
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

const WebhookPayload = z.discriminatedUnion('type', [
  ManyChatPayload,
  CallRailPayload,
  OpenHousePayload,
  ReactivationPayload,
]);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature') ?? '';

  if (!verifyHmacSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
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
      return NextResponse.json({ ok: true, ...result });
    }

    if (payload.type === 'reactivation_batch') {
      const results = await Promise.allSettled(
        payload.contacts.map((c) =>
          runNurtureAgent({
            contactId: c.contactId,
            currentStage: c.stage,
            daysSinceLastInteraction: c.daysSinceLastInteraction,
            leadRoute: c.leadRoute,
            preferredChannel: c.preferredChannel,
            consent: { email: c.consentEmail, sms: c.consentSms },
            context: c.context,
          })
        )
      );

      const summary = results.map((r, i) => ({
        contactId: payload.contacts[i].contactId,
        status: r.status,
        shouldSend: r.status === 'fulfilled' ? r.value.shouldSend : false,
      }));

      return NextResponse.json({ ok: true, processed: summary.length, summary });
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
