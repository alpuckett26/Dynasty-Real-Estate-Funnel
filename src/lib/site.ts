/**
 * Canonical site identity. Used for metadata, sitemap, robots, and JSON-LD.
 *
 * SITE_URL must be the custom domain, never the *.vercel.app deployment URL —
 * Google has indexed both, and pointing canonicals at the deployment URL would
 * split ranking signal between the two hostnames.
 */
export const SITE_URL = 'https://www.adreannetherealtor.com';

/**
 * The booking link to put in anything a prospect sees — emails, SMS, chat
 * replies, cold outreach.
 *
 * Always our own /book page, never a raw Calendly URL. That page hosts the
 * Calendly embed, so the scheduling account can change without touching
 * outbound copy, a misconfigured NEXT_PUBLIC_CALENDLY_URL can't leak the wrong
 * person's calendar into outreach, and every booking click is a measurable
 * pageview on our own domain.
 */
export const BOOKING_URL = `${SITE_URL}/book`;

export const AGENT_NAME = 'Adreanne Aranha';

/**
 * The sponsoring broker Adreanne is licensed under. Louisiana requires agent
 * advertising to identify the sponsoring broker, and consent must be given to
 * the correctly named party — so this is the name that belongs in consent
 * checkboxes, the privacy policy, terms, and outbound message signatures.
 *
 * "Dynasty" is team/brand naming and may remain in marketing copy, but it is
 * not the brokerage and must never stand in for it.
 */
export const BROKERAGE_NAME = 'SMRG Real Estate';
export const TEAM_NAME = 'Dynasty';
export const AGENT_PHONE = '+1-225-284-6854';
export const AGENT_EMAIL = 'adreanne@adreannetherealtor.com';

export const SERVICE_AREAS = [
  'Baton Rouge',
  'Zachary',
  'Prairieville',
  'Denham Springs',
  'Central',
  'Gonzales',
  'Ascension Parish',
  'East Baton Rouge Parish',
];
