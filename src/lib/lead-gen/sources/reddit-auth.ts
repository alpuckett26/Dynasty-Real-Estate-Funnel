/**
 * Reddit OAuth (application-only).
 *
 * Reddit closed anonymous `.json` access in 2026 — every request from every IP
 * came back 403, which is what disabled the reddit-monitor source on
 * 2026-08-15. Access now needs a registered app, so this exchanges the app's
 * client credentials for a bearer token and talks to oauth.reddit.com instead
 * of www.reddit.com.
 *
 * Register the app at https://www.reddit.com/prefs/apps as type "script" or
 * "web app" (both are confidential clients, which is what client_credentials
 * requires — an "installed app" cannot use this grant). Then set:
 *
 *   REDDIT_CLIENT_ID      the string under the app name
 *   REDDIT_CLIENT_SECRET  the "secret" field
 *   REDDIT_USER_AGENT     optional; Reddit rate-limits generic agents harder
 *
 * Application-only tokens are read-only and see exactly what a logged-out user
 * sees, which is all the intent monitor needs.
 */

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
export const REDDIT_API_BASE = 'https://oauth.reddit.com';

/** Reddit asks for a descriptive, unique agent and throttles generic ones. */
const DEFAULT_USER_AGENT = 'web:com.adreannetherealtor.leadgen:v1.0 (intent monitor)';

/**
 * Refresh this long before the token actually expires, so a scan that starts
 * just under the wire doesn't 401 halfway through its subreddit loop.
 */
const EXPIRY_MARGIN_MS = 60_000;

export type RedditAuthFailure =
  /** No app registered — REDDIT_CLIENT_ID/SECRET are unset. Config, not a wall. */
  | 'missing-credentials'
  /** Reddit answered, and said no. Usually wrong or revoked credentials. */
  | 'rejected'
  /** Never got an answer — network fault, timeout, or unparseable body. */
  | 'unreachable';

export class RedditAuthError extends Error {
  constructor(
    readonly kind: RedditAuthFailure,
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'RedditAuthError';
  }
}

interface CachedToken {
  token: string;
  /** Epoch ms after which the token should be treated as spent. */
  expiresAt: number;
}

let cached: CachedToken | null = null;
/** De-dupes concurrent refreshes so one scan makes one token request. */
let inFlight: Promise<string> | null = null;

export interface RedditCredentials {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

/** Returns null when the app has not been registered/configured. */
export function redditCredentials(): RedditCredentials | null {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    userAgent: process.env.REDDIT_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
  };
}

/** Drops the cached token. Exported for tests and for 401 recovery. */
export function resetRedditToken(): void {
  cached = null;
  inFlight = null;
}

/**
 * A valid bearer token, from cache when one is still good.
 *
 * @throws RedditAuthError — always, rather than returning null, because every
 * caller needs the reason to report source health accurately.
 */
export async function getRedditAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }
  if (forceRefresh) resetRedditToken();
  if (inFlight) return inFlight;

  inFlight = requestToken().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function requestToken(): Promise<string> {
  const creds = redditCredentials();
  if (!creds) {
    throw new RedditAuthError(
      'missing-credentials',
      'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are not set — register an app at https://www.reddit.com/prefs/apps'
    );
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');

  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': creds.userAgent,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new RedditAuthError(
      'unreachable',
      `Could not reach Reddit's token endpoint: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    // 401 here means the credentials themselves are wrong or revoked — worth
    // saying plainly, because it looks identical to a bot-wall 403 otherwise.
    const hint = res.status === 401
      ? ' — check REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET, and that the app is a "script" or "web app", not an "installed app"'
      : '';
    throw new RedditAuthError('rejected', `Reddit refused the token request (HTTP ${res.status})${hint}`, res.status);
  }

  let payload: { access_token?: string; expires_in?: number };
  try {
    payload = await res.json() as typeof payload;
  } catch {
    throw new RedditAuthError('unreachable', 'Reddit returned a token response that was not JSON');
  }

  if (!payload.access_token) {
    throw new RedditAuthError('rejected', 'Reddit returned no access_token in its token response');
  }

  // Reddit sends expires_in in seconds (typically 3600). Treat a missing or
  // nonsensical value as a short-lived token rather than caching it forever.
  const lifetimeMs = Math.max(0, (payload.expires_in ?? 0) * 1000 - EXPIRY_MARGIN_MS);
  cached = { token: payload.access_token, expiresAt: Date.now() + lifetimeMs };

  return payload.access_token;
}

/**
 * GET an oauth.reddit.com path with the app token attached.
 *
 * Retries once on 401: application-only tokens can be invalidated before their
 * stated expiry, and the retry turns that into a hiccup instead of a dead scan.
 */
export async function redditApiFetch(path: string, timeoutMs = 10_000): Promise<Response> {
  const creds = redditCredentials();
  if (!creds) {
    throw new RedditAuthError(
      'missing-credentials',
      'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are not set'
    );
  }

  const send = async (token: string) =>
    fetch(`${REDDIT_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': creds.userAgent,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

  const res = await send(await getRedditAccessToken());
  if (res.status !== 401) return res;

  return send(await getRedditAccessToken(true));
}
