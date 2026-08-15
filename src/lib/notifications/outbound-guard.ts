/**
 * Kill switch for every outbound message the app can send.
 *
 * `next start` and `next dev` both load `.env.local`, which holds live Twilio,
 * Resend and Slack credentials. Running any cron or lead route locally therefore
 * sends *real* texts and emails to *real* people — a local test of the lead-gen
 * cron delivered a genuine alert SMS to Adreanne's phone on 2026-08-15, which is
 * what prompted this guard.
 *
 * Set OUTBOUND_DISABLED=true in `.env.local` to make every send a logged no-op.
 * Leave it unset in Vercel so production behaves normally.
 */
export function outboundDisabled(): boolean {
  const flag = process.env.OUTBOUND_DISABLED;
  return flag === 'true' || flag === '1';
}

/** Log what would have been sent, so local runs stay debuggable. */
export function logSuppressed(channel: string, to: string, body: string): void {
  console.log(
    `[OutboundDisabled] Suppressed ${channel} to ${to}: ` +
    `${body.slice(0, 140).replace(/\n/g, ' ')}${body.length > 140 ? '…' : ''}`
  );
}
