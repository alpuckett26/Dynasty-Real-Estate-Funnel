/**
 * Mortgage rates fetcher — Freddie Mac PMMS via FRED API
 *
 * Series used:
 *   MORTGAGE30US  — 30-year fixed
 *   MORTGAGE15US  — 15-year fixed
 *   MORTGAGE5US   — 5/1-year ARM
 *
 * Free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 * Data updates every Thursday.
 */

export interface MortgageRates {
  rate30yr: number;
  rate15yr: number;
  rate5arm: number;
  asOf: string; // ISO date string of the observation
  weekChange30yr: number | null; // vs. prior week, + = up, - = down
  source: 'fred' | 'fallback';
}

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchSeries(seriesId: string, apiKey: string): Promise<{ date: string; value: number }[]> {
  const url = new URL(FRED_BASE);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', '3'); // latest 3 observations

  const res = await fetch(url.toString(), { next: { revalidate: 3600 * 6 } }); // cache 6h
  if (!res.ok) throw new Error(`FRED fetch failed: ${res.status}`);

  const json = await res.json();
  return (json.observations as Array<{ date: string; value: string }>)
    .filter((o) => o.value !== '.')
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

/** Fallback rates used when FRED_API_KEY is not set or fetch fails */
const FALLBACK_RATES: MortgageRates = {
  rate30yr: 6.82,
  rate15yr: 6.13,
  rate5arm: 6.44,
  asOf: new Date().toISOString().split('T')[0],
  weekChange30yr: null,
  source: 'fallback',
};

export async function getCurrentRates(): Promise<MortgageRates> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return FALLBACK_RATES;

  try {
    const [r30, r15, r5] = await Promise.all([
      fetchSeries('MORTGAGE30US', apiKey),
      fetchSeries('MORTGAGE15US', apiKey),
      fetchSeries('MORTGAGE5US', apiKey),
    ]);

    const rate30yr = r30[0]?.value ?? FALLBACK_RATES.rate30yr;
    const prevWeek30yr = r30[1]?.value ?? null;

    return {
      rate30yr,
      rate15yr: r15[0]?.value ?? FALLBACK_RATES.rate15yr,
      rate5arm: r5[0]?.value ?? FALLBACK_RATES.rate5arm,
      asOf: r30[0]?.date ?? FALLBACK_RATES.asOf,
      weekChange30yr: prevWeek30yr !== null ? parseFloat((rate30yr - prevWeek30yr).toFixed(2)) : null,
      source: 'fred',
    };
  } catch (err) {
    console.error('[Rates] FRED fetch error:', err);
    return FALLBACK_RATES;
  }
}

/** Format a rate for display: 6.82 → "6.82%" */
export function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/** Describe the week-over-week change */
export function describeChange(change: number | null): string {
  if (change === null) return '';
  if (change === 0) return 'Unchanged from last week';
  const dir = change > 0 ? '▲' : '▼';
  return `${dir} ${Math.abs(change).toFixed(2)}% from last week`;
}
