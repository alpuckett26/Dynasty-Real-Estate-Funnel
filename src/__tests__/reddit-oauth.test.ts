/**
 * Tests for the Reddit intent monitor's OAuth layer.
 * No network calls — fetch is mocked and routed by URL.
 *
 * The bug class these guard against is the one that disabled this source for
 * months: a scan that returns an empty array for a reason nobody can see. Every
 * failure path below therefore asserts on `health` and `detail`, not just on
 * `leads.length`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { scanRedditForLeads } from '@/lib/lead-gen/sources/reddit';
import {
  RedditAuthError,
  getRedditAccessToken,
  redditCredentials,
  resetRedditToken,
} from '@/lib/lead-gen/sources/reddit-auth';

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

function post(overrides: Partial<{ title: string; selftext: string; author: string; ageHours: number }> = {}) {
  const ageHours = overrides.ageHours ?? 1;
  return {
    data: {
      title: overrides.title ?? 'Looking to buy a house in Baton Rouge, need a realtor',
      selftext: overrides.selftext ?? 'First time homebuyer, working on pre-approval.',
      author: overrides.author ?? 'someuser',
      permalink: '/r/batonrouge/comments/abc123/post/',
      created_utc: Date.now() / 1000 - ageHours * 3600,
      subreddit: 'batonrouge',
    },
  };
}

/**
 * Mock fetch that answers the token endpoint and the API separately, so a test
 * can make one succeed and the other fail.
 */
function mockReddit(opts: {
  token?: { ok?: boolean; status?: number; body?: unknown };
  api?: (url: string, call: number) => { ok: boolean; status: number; body?: unknown };
}) {
  let tokenCalls = 0;
  let apiCalls = 0;

  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === TOKEN_URL) {
      tokenCalls++;
      const t = opts.token ?? {};
      const ok = t.ok ?? true;
      return {
        ok,
        status: t.status ?? (ok ? 200 : 401),
        json: async () => t.body ?? { access_token: 'test-token', expires_in: 3600 },
      } as Response;
    }

    apiCalls++;
    const r = opts.api
      ? opts.api(url, apiCalls)
      : { ok: true, status: 200, body: { data: { children: [post()] } } };
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.body ?? { data: { children: [] } },
    } as Response;
  });

  global.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock, tokenCalls: () => tokenCalls, apiCalls: () => apiCalls };
}

beforeEach(() => {
  resetRedditToken();
  process.env.LEADGEN_ENABLE_REDDIT_MONITOR = 'true';
  process.env.REDDIT_CLIENT_ID = 'test-id';
  process.env.REDDIT_CLIENT_SECRET = 'test-secret';
});

afterEach(() => {
  delete process.env.LEADGEN_ENABLE_REDDIT_MONITOR;
  delete process.env.REDDIT_CLIENT_ID;
  delete process.env.REDDIT_CLIENT_SECRET;
  delete process.env.REDDIT_USER_AGENT;
  resetRedditToken();
  vi.restoreAllMocks();
});

describe('getRedditAccessToken', () => {
  it('exchanges client credentials for a bearer token', async () => {
    const { fetchMock } = mockReddit({});

    expect(await getRedditAccessToken()).toBe('test-token');

    const [url, init] = fetchMock.mock.calls[0];
    if (!init) throw new Error('fetch was called without an init object');
    expect(url).toBe(TOKEN_URL);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('grant_type=client_credentials');

    const headers = init.headers as Record<string, string>;
    // Basic auth, base64 of id:secret — Reddit rejects the grant without it.
    expect(headers.Authorization).toBe(`Basic ${Buffer.from('test-id:test-secret').toString('base64')}`);
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('caches the token instead of re-authenticating per request', async () => {
    const m = mockReddit({});

    await getRedditAccessToken();
    await getRedditAccessToken();
    await getRedditAccessToken();

    expect(m.tokenCalls()).toBe(1);
  });

  it('makes one token request when several callers race for it', async () => {
    const m = mockReddit({});

    await Promise.all([getRedditAccessToken(), getRedditAccessToken(), getRedditAccessToken()]);

    expect(m.tokenCalls()).toBe(1);
  });

  it('re-authenticates once the token has expired', async () => {
    // expires_in is under the 60s safety margin, so it is already spent.
    const m = mockReddit({ token: { body: { access_token: 'short', expires_in: 30 } } });

    await getRedditAccessToken();
    await getRedditAccessToken();

    expect(m.tokenCalls()).toBe(2);
  });

  it('reports missing credentials distinctly from a refusal', async () => {
    delete process.env.REDDIT_CLIENT_ID;
    mockReddit({});

    await expect(getRedditAccessToken()).rejects.toMatchObject({ kind: 'missing-credentials' });
    expect(redditCredentials()).toBeNull();
  });

  it('reports a 401 on the token endpoint as rejected credentials', async () => {
    mockReddit({ token: { ok: false, status: 401 } });

    const err = await getRedditAccessToken().catch((e) => e);
    expect(err).toBeInstanceOf(RedditAuthError);
    expect(err.kind).toBe('rejected');
    expect(err.status).toBe(401);
    expect(err.message).toContain('REDDIT_CLIENT_ID');
  });

  it('treats a token response with no access_token as a refusal', async () => {
    mockReddit({ token: { body: { expires_in: 3600 } } });

    await expect(getRedditAccessToken()).rejects.toMatchObject({ kind: 'rejected' });
  });
});

describe('scanRedditForLeads', () => {
  it('reads oauth.reddit.com with the bearer token, not the anonymous .json endpoint', async () => {
    const { fetchMock } = mockReddit({});

    const scan = await scanRedditForLeads();

    expect(scan.health).toBe('ok');
    const apiCalls = fetchMock.mock.calls.filter(([url]) => url !== TOKEN_URL);
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const [url, init] of apiCalls) {
      expect(url).toContain('https://oauth.reddit.com/r/');
      expect(url).not.toContain('.json');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    }
  });

  it('authenticates once for the whole scan, not once per subreddit', async () => {
    const m = mockReddit({});

    await scanRedditForLeads();

    expect(m.tokenCalls()).toBe(1);
    expect(m.apiCalls()).toBeGreaterThan(1);
  });

  it('extracts and scores an intent post', async () => {
    mockReddit({});

    const scan = await scanRedditForLeads();

    const lead = scan.leads[0];
    expect(lead.source).toBe('reddit-monitor');
    expect(lead.intentType).toBe('buyer');
    expect(lead.intentScore).toBeGreaterThanOrEqual(3);
    expect(lead.url).toBe('https://reddit.com/r/batonrouge/comments/abc123/post/');
  });

  it('skips posts older than 48 hours', async () => {
    mockReddit({ api: () => ({ ok: true, status: 200, body: { data: { children: [post({ ageHours: 72 })] } } }) });

    const scan = await scanRedditForLeads();

    // Reachable and parsed — genuinely nothing recent, which is not a failure.
    expect(scan.leads).toHaveLength(0);
    expect(scan.health).toBe('ok');
  });

  it('reports blocked — not a quiet day — when the API returns 403', async () => {
    mockReddit({ api: () => ({ ok: false, status: 403 }) });

    const scan = await scanRedditForLeads();

    expect(scan.health).toBe('blocked');
    expect(scan.detail).toContain('403');
    expect(scan.leads).toHaveLength(0);
  });

  it('stops the scan on a 429 rather than burning the rest of the quota', async () => {
    const m = mockReddit({ api: () => ({ ok: false, status: 429 }) });

    const scan = await scanRedditForLeads();

    expect(m.apiCalls()).toBe(1);
    expect(scan.health).toBe('blocked');
  });

  it('refreshes the token and retries once when a request 401s mid-scan', async () => {
    const m = mockReddit({
      api: (_url, call) =>
        call === 1
          ? { ok: false, status: 401 }
          : { ok: true, status: 200, body: { data: { children: [post()] } } },
    });

    const scan = await scanRedditForLeads();

    // Two token requests: the initial one, plus the forced refresh.
    expect(m.tokenCalls()).toBe(2);
    expect(scan.health).toBe('ok');
    expect(scan.leads.length).toBeGreaterThan(0);
  });

  it('reports an error — not a silent zero — when enabled without credentials', async () => {
    delete process.env.REDDIT_CLIENT_SECRET;
    mockReddit({});

    const scan = await scanRedditForLeads();

    expect(scan.health).toBe('error');
    expect(scan.detail).toContain('missing-credentials');
    expect(scan.leads).toHaveLength(0);
  });

  it('reports an error when the credentials are rejected', async () => {
    mockReddit({ token: { ok: false, status: 401 } });

    const scan = await scanRedditForLeads();

    expect(scan.health).toBe('error');
    expect(scan.detail).toContain('rejected');
  });

  it('stays disabled — and makes no requests — while the flag is off', async () => {
    delete process.env.LEADGEN_ENABLE_REDDIT_MONITOR;
    const m = mockReddit({});

    const scan = await scanRedditForLeads();

    expect(scan.health).toBe('disabled');
    expect(m.tokenCalls()).toBe(0);
    expect(m.apiCalls()).toBe(0);
  });

  it('sends a descriptive user agent, overridable by env', async () => {
    process.env.REDDIT_USER_AGENT = 'web:custom:v2 (by /u/adreanne)';
    const { fetchMock } = mockReddit({});

    await scanRedditForLeads();

    for (const [, init] of fetchMock.mock.calls) {
      expect((init?.headers as Record<string, string>)['User-Agent']).toBe('web:custom:v2 (by /u/adreanne)');
    }
  });
});
