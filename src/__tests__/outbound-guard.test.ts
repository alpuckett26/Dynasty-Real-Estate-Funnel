import { describe, it, expect, vi, afterEach } from 'vitest';
import { outboundDisabled } from '@/lib/notifications/outbound-guard';
import { sendSMS } from '@/lib/sms/twilio';
import { postSlackText } from '@/lib/notifications/slack-webhook';
import { sendEmail } from '@/lib/email/resend';

/**
 * Guards against the failure this switch exists for: a local `next start` loads
 * .env.local with live credentials, so testing a cron route texted Adreanne for
 * real on 2026-08-15.
 */
afterEach(() => {
  delete process.env.OUTBOUND_DISABLED;
  vi.restoreAllMocks();
});

describe('outboundDisabled', () => {
  it('is off unless explicitly set, so production is unaffected', () => {
    expect(outboundDisabled()).toBe(false);
  });

  it('accepts true and 1', () => {
    process.env.OUTBOUND_DISABLED = 'true';
    expect(outboundDisabled()).toBe(true);
    process.env.OUTBOUND_DISABLED = '1';
    expect(outboundDisabled()).toBe(true);
  });

  it('ignores other values rather than guessing', () => {
    process.env.OUTBOUND_DISABLED = 'no';
    expect(outboundDisabled()).toBe(false);
  });
});

describe('outbound channels while suppressed', () => {
  it('sends no SMS and does not need Twilio credentials', async () => {
    process.env.OUTBOUND_DISABLED = 'true';
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    // Would otherwise throw "Twilio credentials not configured".
    await expect(sendSMS('2255551234', 'test message')).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts nothing to Slack but reports delivered, so callers do not escalate', async () => {
    process.env.OUTBOUND_DISABLED = 'true';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/fake';
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    await expect(postSlackText('test alert')).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    delete process.env.SLACK_WEBHOOK_URL;
  });

  it('sends no email and does not need a Resend key', async () => {
    process.env.OUTBOUND_DISABLED = 'true';
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    await expect(
      sendEmail({ to: 'lead@example.com', subject: 'Hi', text: 'body' })
    ).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
