/**
 * First-touch attribution capture.
 *
 * Forms previously read UTM params off the URL at submit time, so a visitor who
 * landed on /down-payment-assistance?utm_source=facebook and then navigated to
 * /book before converting was recorded as direct traffic. This stashes the
 * first set of campaign params seen in the session and replays them at submit.
 *
 * sessionStorage (not localStorage) keeps this scoped to the visit, so it stays
 * functional attribution rather than cross-session marketing storage.
 */

const KEY = 'dre_attribution';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
}

const PARAM_MAP: [string, keyof Attribution][] = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
  ['utm_content', 'utmContent'],
  ['utm_term', 'utmTerm'],
  ['gclid', 'gclid'],
  ['fbclid', 'fbclid'],
];

function readFromUrl(): Attribution {
  const p = new URLSearchParams(window.location.search);
  const found: Attribution = {};
  for (const [param, key] of PARAM_MAP) {
    const value = p.get(param);
    if (value) found[key] = value;
  }
  return found;
}

/**
 * Record campaign params if this is the first touch of the session.
 * Safe to call on every page view.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(KEY)) return;

    const found = readFromUrl();
    const hasCampaignData = Object.keys(found).length > 0;
    const isExternalReferrer =
      document.referrer && !document.referrer.includes(window.location.host);

    // Only claim a first touch when there's something to attribute.
    if (!hasCampaignData && !isExternalReferrer) return;

    const record: Attribution = {
      ...found,
      landingPage: window.location.pathname,
      referrer: document.referrer || undefined,
    };
    sessionStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Private browsing / storage disabled — fall back to per-submit URL params.
  }
}

/**
 * Attribution for a form submission: the stored first touch, with any params on
 * the current URL taking precedence if the visitor arrived via a fresh click.
 */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};

  let stored: Attribution = {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Attribution;
  } catch {
    // ignore
  }

  return { ...stored, ...readFromUrl() };
}
