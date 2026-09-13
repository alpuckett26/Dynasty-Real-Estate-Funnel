/**
 * Twilio SMS client
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

import twilio from 'twilio';
import { postSlackText } from '@/lib/notifications/slack-webhook';
import { sendEmail } from '@/lib/email/resend';
import { logSuppressed, outboundDisabled } from '@/lib/notifications/outbound-guard';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured');
  return twilio(sid, token);
}

export async function sendSMS(to: string, body: string): Promise<void> {
  // Checked before credentials so a local run never texts a real person.
  if (outboundDisabled()) {
    logSuppressed('SMS', to, body);
    return;
  }

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

export type AlertChannel = 'sms' | 'slack' | 'email';

/**
 * Alert Adreanne directly — SMS to OWNER_PHONE, falling back to Slack, then
 * email.
 *
 * SMS is the primary channel because it actually gets read, but it has a
 * failure mode with no signal: an exhausted Twilio balance throws, and a
 * swallowed error means hot-lead alerts stop arriving with nothing to notice.
 * Slack is the first fallback, but GO-LIVE lists it as optional — without it,
 * an empty Twilio balance used to drop every hot-lead alert into the logs.
 * Email (DIGEST_EMAIL / REPLY_TO_EMAIL) is the last resort because Resend is
 * a separate provider and is already required for nurture.
 *
 * Never throws. Returns the channel that delivered, or null if the alert was
 * lost, so callers can report honestly instead of assuming it arrived.
 */
export async function alertOwner(body: string): Promise<AlertChannel | null> {
  const ownerPhone = process.env.OWNER_PHONE;
  let smsFailure = '';

  if (ownerPhone) {
    try {
      await sendSMS(ownerPhone, body);
      return 'sms';
    } catch (err) {
      smsFailure = err instanceof Error ? err.message : String(err);
      console.error('[OwnerAlert] SMS failed, falling back to Slack:', err);
    }
  }

  const prefix = smsFailure
    ? `⚠️ SMS alert could not be delivered — sending here instead.\nReason: ${smsFailure}\n\n`
    : '';

  if (await postSlackText(prefix + body)) return 'slack';

  const alertEmail = process.env.DIGEST_EMAIL ?? process.env.REPLY_TO_EMAIL;
  if (alertEmail) {
    try {
      await sendEmail({
        to: alertEmail,
        subject: `⚠️ Funnel alert${smsFailure ? ' (SMS failed)' : ''}: ${body.split('\n')[0].slice(0, 80)}`,
        text: prefix + body,
      });
      return 'email';
    } catch (err) {
      console.error('[OwnerAlert] Email fallback failed:', err);
    }
  }

  console.error('[OwnerAlert] Every alert channel failed or is unconfigured. Alert lost:', body);
  return null;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
