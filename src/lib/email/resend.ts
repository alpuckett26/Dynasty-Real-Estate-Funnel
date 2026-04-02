/**
 * Resend email client
 * Env vars: RESEND_API_KEY, FROM_EMAIL
 */

import { Resend } from 'resend';

let _client: Resend | null = null;

function getClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not configured');
    _client = new Resend(key);
  }
  return _client;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const from = process.env.FROM_EMAIL ?? 'Dynasty Real Estate <noreply@dynastypartnersllc.com>';
  const client = getClient();
  const { error } = await client.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    replyTo: params.replyTo ?? process.env.REPLY_TO_EMAIL ?? 'adreanne@dynastypartnersllc.com',
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
