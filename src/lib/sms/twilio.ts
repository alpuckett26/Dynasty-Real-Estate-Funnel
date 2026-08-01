/**
 * Twilio SMS client
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

import twilio from 'twilio';

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

/** Alert Adreanne directly — uses OWNER_PHONE env var */
export async function alertOwner(body: string): Promise<void> {
  const ownerPhone = process.env.OWNER_PHONE;
  if (!ownerPhone) return; // silently skip if not set
  try {
    await sendSMS(ownerPhone, body);
  } catch (err) {
    console.error('[OwnerAlert] SMS failed:', err);
  }
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
