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
export const BROKERAGE_NAME = 'Dynasty Real Estate';
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
