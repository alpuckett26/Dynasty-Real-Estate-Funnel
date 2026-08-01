/**
 * Twilio SMS client
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

import twilio from 'twilio';
import { postSlackText } from '@/lib/notifications/slack-webhook';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured');
  return twilio(sid, token);
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!messagingServiceSid && !from) {
    throw new Error('Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER');
  }

  const e164 = normalizePhone(to);
  if (!e164) throw new Error(`Invalid phone number: ${to}`);

  const client = getClient();
  // Prefer the Messaging Service: it carries the registered A2P 10DLC campaign
  // and gives sticky sender and failover. Fall back to the bare number.
  await client.messages.create(
    messagingServiceSid
      ? { to: e164, messagingServiceSid, body }
      : { to: e164, from: from as string, body }
  );
}

/**
 * Alert Adreanne directly — SMS to OWNER_PHONE, falling back to Slack.
 *
 * SMS is the primary channel because it actually gets read, but it has a
 * failure mode with no signal: an exhausted Twilio balance throws, and a
 * swallowed error means hot-lead alerts stop arriving with nothing to notice.
 * Slack is free and already configured, so a failed send degrades to a
 * delivered-somewhere-else alert rather than silence.
 */
export async function alertOwner(body: string): Promise<void> {
  const ownerPhone = process.env.OWNER_PHONE;

  if (ownerPhone) {
    try {
      await sendSMS(ownerPhone, body);
      return;
    } catch (err) {
      console.error('[OwnerAlert] SMS failed, falling back to Slack:', err);
      const delivered = await postSlackText(
        `⚠️ SMS alert could not be delivered — sending here instead.\n` +
          `Reason: ${err instanceof Error ? err.message : String(err)}\n\n${body}`
      );
      if (!delivered) {
        console.error('[OwnerAlert] Slack fallback also failed. Alert lost:', body);
      }
      return;
    }
  }

  // No phone configured — still try not to drop the alert.
  const delivered = await postSlackText(body);
  if (!delivered) {
    console.error('[OwnerAlert] No OWNER_PHONE and no Slack webhook. Alert lost:', body);
  }
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
