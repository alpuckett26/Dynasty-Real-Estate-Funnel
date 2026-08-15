import { describe, it, expect, afterEach } from 'vitest';
import {
  classifyStatus,
  summariseHealth,
  needsAttention,
  isSourceEnabled,
  disabledScan,
  type SourceScan,
} from '@/lib/lead-gen/source-health';
import { hasUsableAuthor } from '@/lib/lead-gen/processor';

const ENV_KEYS = [
  'LEADGEN_ENABLE_REDDIT_MONITOR',
  'LEADGEN_ENABLE_CITY_DATA',
  'LEADGEN_ENABLE_CRAIGSLIST_FSBO',
];

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('classifyStatus', () => {
  it('treats bot walls as blocked, not transient errors', () => {
    expect(classifyStatus(403)).toBe('blocked');
    expect(classifyStatus(429)).toBe('blocked');
    expect(classifyStatus(401)).toBe('blocked');
  });

  it('treats server and not-found responses as errors', () => {
    expect(classifyStatus(500)).toBe('error');
    expect(classifyStatus(404)).toBe('error');
  });
});

describe('summariseHealth', () => {
  it('reports ok when everything succeeded', () => {
    expect(summariseHealth(6, { blocked: 0, error: 0 }).health).toBe('ok');
  });

  it('reports ok when only some requests failed', () => {
    // Partial failure still produced data, so it is not a dead source.
    const result = summariseHealth(6, { blocked: 2, error: 0 });
    expect(result.health).toBe('ok');
    expect(result.detail).toContain('4/6');
  });

  it('reports blocked when every request was refused', () => {
    // This is the Reddit case that used to look identical to a quiet day.
    const result = summariseHealth(6, { blocked: 6, error: 0 });
    expect(result.health).toBe('blocked');
    expect(result.detail).toMatch(/403/);
  });

  it('reports error when every request failed for other reasons', () => {
    expect(summariseHealth(3, { blocked: 0, error: 3 }).health).toBe('error');
  });

  it('prefers the blocked diagnosis on a mixed total failure', () => {
    expect(summariseHealth(4, { blocked: 3, error: 1 }).health).toBe('blocked');
  });

  it('flags a source that never attempted a request', () => {
    expect(summariseHealth(0, { blocked: 0, error: 0 }).health).toBe('error');
  });
});

describe('needsAttention', () => {
  const scan = (health: SourceScan<unknown>['health']): SourceScan<unknown> => ({
    source: 's', health, detail: '', leads: [], requests: 0, failures: 0,
  });

  it('alerts on blocked and errored sources', () => {
    expect(needsAttention(scan('blocked'))).toBe(true);
    expect(needsAttention(scan('error'))).toBe(true);
  });

  it('stays quiet for healthy and deliberately disabled sources', () => {
    expect(needsAttention(scan('ok'))).toBe(false);
    expect(needsAttention(scan('disabled'))).toBe(false);
  });
});

describe('isSourceEnabled', () => {
  it('defaults the verified-dead sources to off', () => {
    expect(isSourceEnabled('reddit-monitor')).toBe(false);
    expect(isSourceEnabled('city-data')).toBe(false);
    expect(isSourceEnabled('craigslist-fsbo')).toBe(false);
  });

  it('defaults an unlisted source to on', () => {
    expect(isSourceEnabled('redx')).toBe(true);
  });

  it('can be switched back on without a code change', () => {
    process.env.LEADGEN_ENABLE_REDDIT_MONITOR = 'true';
    expect(isSourceEnabled('reddit-monitor')).toBe(true);
    process.env.LEADGEN_ENABLE_REDDIT_MONITOR = '1';
    expect(isSourceEnabled('reddit-monitor')).toBe(true);
  });

  it('can be switched off explicitly', () => {
    process.env.LEADGEN_ENABLE_CITY_DATA = 'false';
    expect(isSourceEnabled('city-data')).toBe(false);
  });
});

describe('disabledScan', () => {
  it('returns an empty, non-alerting scan', () => {
    const scan = disabledScan('city-data');
    expect(scan.health).toBe('disabled');
    expect(scan.leads).toEqual([]);
    expect(needsAttention(scan)).toBe(false);
  });
});

describe('hasUsableAuthor', () => {
  it('accepts a real username', () => {
    expect(hasUsableAuthor('SouthernBoy205')).toBe(true);
  });

  it('rejects the placeholders that became junk CRM records', () => {
    expect(hasUsableAuthor('Unknown')).toBe(false);
    expect(hasUsableAuthor('unknown')).toBe(false);
    expect(hasUsableAuthor('[deleted]')).toBe(false);
    expect(hasUsableAuthor('Anonymous')).toBe(false);
  });

  it('rejects empty and missing authors', () => {
    expect(hasUsableAuthor('')).toBe(false);
    expect(hasUsableAuthor('   ')).toBe(false);
    expect(hasUsableAuthor(undefined)).toBe(false);
  });
});
