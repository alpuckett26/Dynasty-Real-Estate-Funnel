/**
 * Lead-gen source health.
 *
 * Every scraper source used to return a bare array and swallow HTTP failures
 * with `if (!res.ok) continue`. A source that had been hard-blocked for months
 * was therefore indistinguishable from a quiet day: the cron logged
 * "0 found, 0 new, 0 errors" and reported success. Sources now report *why*
 * they returned nothing, so a dead source raises an alert instead of passing
 * for a slow one.
 */

export type SourceHealth =
  /** Reachable and parsed. May still legitimately have found nothing. */
  | 'ok'
  /** The site refused us — 403/429/captcha. Not a quiet day; a wall. */
  | 'blocked'
  /** Network failure, timeout, or unparseable response. */
  | 'error'
  /** Deliberately switched off — see DEFAULT_ENABLED for the evidence. */
  | 'disabled';

export interface SourceScan<T> {
  source: string;
  health: SourceHealth;
  /** Human-readable reason, safe to drop straight into an SMS or Slack alert. */
  detail: string;
  leads: T[];
  /** HTTP requests attempted and how many came back unusable. */
  requests: number;
  failures: number;
}

/**
 * Sources are off by default when they have been verified unusable. Flip one
 * back on with LEADGEN_ENABLE_<SOURCE>=true (e.g. LEADGEN_ENABLE_REDDIT_MONITOR).
 *
 * Verified by live probe on 2026-08-15:
 *
 * - reddit-monitor  HTTP 403 on every subreddit, from both cloud and home IPs.
 *   Reddit now requires OAuth for API access; the anonymous .json endpoints
 *   this used are closed. Re-enabling needs a registered Reddit app.
 *
 * - craigslist-fsbo HTTP 403 on the RSS feed from a residential IP too, so the
 *   documented "run it from a home machine" workaround no longer helps.
 *
 * - city-data       Reachable (HTTP 200), but unusable as a lead source: the
 *   forum filter is ignored server-side. A search for "moving to baton rouge"
 *   scoped to forum 153 (Baton Rouge) returned zero Louisiana threads — the top
 *   30 results were national threads on Florida politics, college football and
 *   Asheville, with last posts as old as 2022, and no contact details on any of
 *   them. Parsing it correctly would only load more junk into the CRM.
 */
const DEFAULT_ENABLED: Record<string, boolean> = {
  'reddit-monitor': false,
  'craigslist-fsbo': false,
  'city-data': false,
};

export function isSourceEnabled(source: string): boolean {
  const envKey = `LEADGEN_ENABLE_${source.toUpperCase().replace(/-/g, '_')}`;
  const override = process.env[envKey];
  if (override !== undefined) return override === 'true' || override === '1';
  return DEFAULT_ENABLED[source] ?? true;
}

export function disabledScan<T>(source: string): SourceScan<T> {
  return {
    source,
    health: 'disabled',
    detail: 'Disabled — source verified unusable. See src/lib/lead-gen/source-health.ts',
    leads: [],
    requests: 0,
    failures: 0,
  };
}

/**
 * Classify a fetch outcome. A 403/429 is the signature of a bot wall rather
 * than a transient fault, and is worth distinguishing because it never
 * recovers on its own.
 */
export function classifyStatus(status: number): 'blocked' | 'error' {
  return status === 403 || status === 429 || status === 401 ? 'blocked' : 'error';
}

/**
 * Roll per-request outcomes up into one health verdict for the source.
 * Blocked wins over error: it is the more actionable diagnosis.
 */
export function summariseHealth(
  requests: number,
  failures: { blocked: number; error: number }
): { health: SourceHealth; detail: string } {
  const totalFailed = failures.blocked + failures.error;

  if (requests === 0) {
    return { health: 'error', detail: 'No requests were attempted' };
  }
  if (totalFailed === 0) {
    return { health: 'ok', detail: `All ${requests} requests succeeded` };
  }
  if (totalFailed < requests) {
    return {
      health: 'ok',
      detail: `${requests - totalFailed}/${requests} requests succeeded ` +
        `(${failures.blocked} blocked, ${failures.error} errored)`,
    };
  }
  if (failures.blocked >= failures.error) {
    return {
      health: 'blocked',
      detail: `All ${requests} requests were refused (HTTP 403/429) — the site is blocking us`,
    };
  }
  return {
    health: 'error',
    detail: `All ${requests} requests failed (network error or bad response)`,
  };
}

/**
 * True when a scan represents a real problem worth waking someone over.
 * Takes just the health so callers can pass a scan or a processed result.
 */
export function needsAttention(scan: { health: SourceHealth }): boolean {
  return scan.health === 'blocked' || scan.health === 'error';
}
