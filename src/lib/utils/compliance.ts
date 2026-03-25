/**
 * Compliance utilities — fair housing, consent, opt-out, quiet hours.
 * All AI-generated text MUST pass through isFairHousingSafe before sending.
 */

const FAIR_HOUSING_VIOLATIONS = [
  /\b(no (kids|children|families|pets))\b/i,
  /\b(perfect for (couples|singles|young professionals))\b/i,
  /\b(great (neighborhood|area|school district) for (whites|blacks|asians|latinos|hispanics))\b/i,
  /\b(exclusive|exclusionary|restricted)\b/i,
  /\b(preferred (race|religion|national origin|sex|familial status|disability))\b/i,
  /\b(Christians? only|Muslims? only|Jewish only)\b/i,
  /\b(walking distance to (church|synagogue|mosque|temple))\b/i, // steering
  /\b(safe (neighborhood|area|community) for\b)/i,
];

const OPT_OUT_KEYWORDS = [
  'stop',
  'unsubscribe',
  'opt out',
  'opt-out',
  'remove me',
  'cancel',
  'quit',
  'end',
  'no more',
];

const LEGAL_SENSITIVE_TOPICS = [
  /\b(legal advice|legally speaking|you should sue|breach of contract)\b/i,
  /\b(guaranteed (sale|price|offer|roi|return))\b/i,
  /\b(I promise (you|the price|the value))\b/i,
  /\b(discriminat(e|ion|ory))\b/i,
];

// Quiet hours: 9 PM – 8 AM in the contact's local timezone
const QUIET_HOURS_START = 21; // 9 PM
const QUIET_HOURS_END = 8;    // 8 AM

export function isFairHousingSafe(text: string): boolean {
  return !FAIR_HOUSING_VIOLATIONS.some((pattern) => pattern.test(text));
}

export function isLegalSensitive(text: string): boolean {
  return LEGAL_SENSITIVE_TOPICS.some((pattern) => pattern.test(text));
}

export function isOptOutMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return OPT_OUT_KEYWORDS.some((kw) => lower.includes(kw));
}

export function isWithinQuietHours(
  hourInLocalTime: number = new Date().getHours()
): boolean {
  return hourInLocalTime >= QUIET_HOURS_START || hourInLocalTime < QUIET_HOURS_END;
}

export function validateConsentBeforeSend(
  channel: 'sms' | 'email' | 'dm',
  consent: Record<string, boolean>
): boolean {
  return consent[channel] === true;
}

export function sanitizeAIOutput(text: string): {
  safe: boolean;
  sanitized: string;
  flags: string[];
} {
  const flags: string[] = [];

  if (!isFairHousingSafe(text)) {
    flags.push('fair_housing_violation');
  }
  if (isLegalSensitive(text)) {
    flags.push('legal_sensitive');
  }

  return {
    safe: flags.length === 0,
    sanitized: text,
    flags,
  };
}

export const FAIR_HOUSING_FOOTER =
  '\n\nDynasty Real Estate is an equal opportunity housing provider.';

export const SAFE_MESSAGING_GUIDELINES = `
FAIR HOUSING GUIDELINES (MANDATORY):
- Never mention race, color, religion, national origin, sex, disability, or familial status in relation to neighborhoods or properties.
- Never suggest which types of people are suited for a neighborhood.
- Use neutral language: "close to amenities", "established community", "convenient location".
- Do not steer clients toward or away from neighborhoods based on protected characteristics.
- Never make guarantees about price, sale timeline, or investment returns.
- Redirect all legal questions to an attorney.
- Do not provide specific tax or mortgage advice.
`.trim();
