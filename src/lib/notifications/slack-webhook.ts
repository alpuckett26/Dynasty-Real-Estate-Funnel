/**
 * Minimal Slack webhook post.
 *
 * Kept separate from slack.ts so the SMS layer can fall back to Slack without
 * a circular import (slack.ts already imports the SMS layer).
 */

import { logSuppressed, outboundDisabled } from '@/lib/notifications/outbound-guard';

export async function postSlackText(text: string): Promise<boolean> {
  if (outboundDisabled()) {
    logSuppressed('Slack', 'webhook', text);
    // Reported as delivered so callers don't escalate to another channel.
    return true;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Slack] Webhook post failed:', err);
    return false;
  }
}
