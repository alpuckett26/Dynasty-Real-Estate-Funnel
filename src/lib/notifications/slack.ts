/**
 * Hot-lead alerts — Slack Block Kit + direct SMS to owner via Twilio
 * Set SLACK_WEBHOOK_URL and/or OWNER_PHONE in your environment to enable.
 */

import { alertOwner } from '@/lib/sms/twilio';

interface HotLeadPayload {
  name: string;
  phone?: string;
  email?: string;
  intent: string;
  score: number;
  tags: string[];
  source: string;
  contactId: string;
}

export async function notifyHotLead(payload: HotLeadPayload): Promise<void> {
  // 1. SMS Adreanne directly
  const smsBody = `🔥 HOT LEAD — Adreanne\n${payload.name}\n${payload.phone ?? payload.email ?? 'No contact'}\nIntent: ${capitalise(payload.intent)} | Score: ${payload.score}\nCall NOW → HubSpot: https://app.hubspot.com/contacts/${process.env.HUBSPOT_PORTAL_ID}/contact/${payload.contactId}`;
  await alertOwner(smsBody);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const hubspotLink = portalId
    ? `https://app.hubspot.com/contacts/${portalId}/contact/${payload.contactId}`
    : null;

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔥 Hot Lead Alert — Adreanne The Realtor', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${payload.name}` },
        { type: 'mrkdwn', text: `*Intent:*\n${capitalise(payload.intent)}` },
        { type: 'mrkdwn', text: `*Phone:*\n${payload.phone ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Email:*\n${payload.email ?? 'N/A'}` },
        { type: 'mrkdwn', text: `*Lead Score:*\n${payload.score}` },
        { type: 'mrkdwn', text: `*Source:*\n${payload.source}` },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Tags:* ${payload.tags.join(' · ')}`,
      },
    },
    ...(hubspotLink
      ? [
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View in HubSpot', emoji: true },
                url: hubspotLink,
                style: 'primary',
              },
            ],
          },
        ]
      : []),
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Submitted ${new Date().toLocaleString()} · Respond within 30 minutes for best conversion`,
        },
      ],
    },
  ];

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

function capitalise(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
