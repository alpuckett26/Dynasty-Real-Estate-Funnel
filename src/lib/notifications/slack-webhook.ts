/**
 * Minimal Slack webhook post.
 *
 * Kept separate from slack.ts so the SMS layer can fall back to Slack without
 * a circular import (slack.ts already imports the SMS layer).
 */

export async function postSlackText(text: string): Promise<boolean> {
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
