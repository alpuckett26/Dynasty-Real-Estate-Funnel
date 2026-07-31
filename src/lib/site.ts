/**
 * Canonical site identity. Used for metadata, sitemap, robots, and JSON-LD.
 *
 * SITE_URL must be the custom domain, never the *.vercel.app deployment URL —
 * Google has indexed both, and pointing canonicals at the deployment URL would
 * split ranking signal between the two hostnames.
 */
export const SITE_URL = 'https://www.adreannetherealtor.com';

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
