import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sendEmail = vi.fn();
vi.mock('@/lib/email/resend', () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));

const create = vi.fn();
vi.mock('twilio', () => ({ default: () => ({ messages: { create } }) }));

import { alertOwner } from '@/lib/sms/twilio';

/**
 * Slack is optional in GO-LIVE, so an empty Twilio balance with no Slack
 * webhook used to drop hot-lead alerts into the logs with nothing to notice.
 */
const ENV_KEYS = [
  'OWNER_PHONE', 'SLACK_WEBHOOK_URL', 'DIGEST_EMAIL', 'REPLY_TO_EMAIL',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'OUTBOUND_DISABLED',
];

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  process.env.TWILIO_ACCOUNT_SID = 'AC_test';
  process.env.TWILIO_AUTH_TOKEN = 'token';
  process.env.TWILIO_FROM_NUMBER = '+12255550000';
  sendEmail.mockReset();
  create.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  vi.restoreAllMocks();
});

describe('alertOwner', () => {
  it('reports sms when the text goes out', async () => {
    process.env.OWNER_PHONE = '2255551234';
    create.mockResolvedValue({});
    await expect(alertOwner('hot lead')).resolves.toBe('sms');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('falls back to Slack when SMS fails', async () => {
    process.env.OWNER_PHONE = '2255551234';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/fake';
    create.mockRejectedValue(new Error('Account balance exhausted'));
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await expect(alertOwner('hot lead')).resolves.toBe('slack');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('falls back to email when SMS fails and Slack is not configured', async () => {
    process.env.OWNER_PHONE = '2255551234';
    process.env.DIGEST_EMAIL = 'adreanne@example.com';
    create.mockRejectedValue(new Error('Account balance exhausted'));
    sendEmail.mockResolvedValue(undefined);

    await expect(alertOwner('🔥 HOT LEAD\nJane Doe')).resolves.toBe('email');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [params] = sendEmail.mock.calls[0] as [{ to: string; text: string }];
    expect(params.to).toBe('adreanne@example.com');
    expect(params.text).toContain('Account balance exhausted');
    expect(params.text).toContain('Jane Doe');
  });

  it('returns null rather than throwing when every channel fails', async () => {
    process.env.OWNER_PHONE = '2255551234';
    process.env.DIGEST_EMAIL = 'adreanne@example.com';
    create.mockRejectedValue(new Error('down'));
    sendEmail.mockRejectedValue(new Error('Resend error'));

    await expect(alertOwner('hot lead')).resolves.toBeNull();
  });
});
