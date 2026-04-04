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
  const from = process.env.FROM_EMAIL ?? 'Adreanne The Realtor <info@adreannetherealtor.com>';
  const client = getClient();
  const { error } = await client.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: textToHtml(params.text),
    replyTo: params.replyTo ?? process.env.REPLY_TO_EMAIL ?? 'info@adreannetherealtor.com',
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

/**
 * Converts plain text email body to a simple HTML email
 * that avoids the Promotions tab.
 */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n').map((line) => {
    if (line.trim() === '') return '<br>';
    // Bold lines that start with ** or are all caps short labels
    const bolded = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return `<p style="margin:0 0 8px 0;line-height:1.6">${bolded}</p>`;
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff">
  ${lines.join('\n  ')}
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
  <p style="font-size:12px;color:#888;margin:0">
    Adreanne The Realtor &bull; (225) 284-6854 &bull; <a href="https://adreannetherealtor.com" style="color:#888">adreannetherealtor.com</a><br>
    <a href="{unsubscribeUrl}" style="color:#888">Unsubscribe</a>
  </p>
</body>
</html>`;
}
