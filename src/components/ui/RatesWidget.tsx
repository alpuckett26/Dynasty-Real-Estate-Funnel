import { getCurrentRates, formatRate, describeChange } from '@/lib/rates';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface RatesWidgetProps {
  variant?: 'banner' | 'card' | 'inline';
  showCTA?: boolean;
}

export async function RatesWidget({ variant = 'card', showCTA = true }: RatesWidgetProps) {
  const rates = await getCurrentRates();

  const changeIcon =
    rates.weekChange30yr === null || rates.weekChange30yr === 0 ? (
      <Minus className="h-3.5 w-3.5 text-gray-400" />
    ) : rates.weekChange30yr > 0 ? (
      <TrendingUp className="h-3.5 w-3.5 text-red-400" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 text-green-400" />
    );

  const changeColor =
    rates.weekChange30yr === null || rates.weekChange30yr === 0
      ? 'text-gray-400'
      : rates.weekChange30yr > 0
      ? 'text-red-400'
      : 'text-green-400';

  const asOfFormatted = new Date(rates.asOf + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (variant === 'banner') {
    return (
      <div className="bg-navy-900 border-b border-navy-800 py-2">
        <div className="container-wide flex flex-wrap items-center justify-center gap-6 text-sm">
          <span className="text-gray-400 text-xs">Rates as of {asOfFormatted}:</span>
          <span className="font-semibold text-white">
            30-yr Fixed: <span className="text-brand-400">{formatRate(rates.rate30yr)}</span>
          </span>
          <span className="font-semibold text-white">
            15-yr Fixed: <span className="text-brand-400">{formatRate(rates.rate15yr)}</span>
          </span>
          <span className="font-semibold text-white">
            5/1 ARM: <span className="text-brand-400">{formatRate(rates.rate5arm)}</span>
          </span>
          {rates.weekChange30yr !== null && (
            <span className={`flex items-center gap-1 text-xs ${changeColor}`}>
              {changeIcon}
              {describeChange(rates.weekChange30yr)}
            </span>
          )}
          {showCTA && (
            <a href="/book" className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition-colors">
              Get Pre-Approved
            </a>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { label: '30-yr Fixed', value: formatRate(rates.rate30yr) },
          { label: '15-yr Fixed', value: formatRate(rates.rate15yr) },
          { label: '5/1 ARM', value: formatRate(rates.rate5arm) },
        ].map((r) => (
          <div key={r.label} className="text-center">
            <p className="text-xl font-bold text-brand-600">{r.value}</p>
            <p className="text-xs text-gray-500">{r.label}</p>
          </div>
        ))}
        <p className="w-full text-xs text-gray-400">
          Source: Freddie Mac PMMS · {asOfFormatted}
          {rates.weekChange30yr !== null && (
            <span className={`ml-2 ${changeColor}`}>
              {describeChange(rates.weekChange30yr)}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Default: card
  return (
    <div className="rounded-2xl bg-navy-900 p-6 ring-1 ring-navy-800">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Today&apos;s Mortgage Rates</p>
        <span className="text-xs text-gray-500">{asOfFormatted}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '30-yr Fixed', value: formatRate(rates.rate30yr), highlight: true },
          { label: '15-yr Fixed', value: formatRate(rates.rate15yr), highlight: false },
          { label: '5/1 ARM', value: formatRate(rates.rate5arm), highlight: false },
        ].map((r) => (
          <div key={r.label} className="text-center rounded-xl bg-navy-800 py-3 px-2">
            <p className={`text-lg font-bold ${r.highlight ? 'text-brand-400' : 'text-white'}`}>{r.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {rates.weekChange30yr !== null && (
        <p className={`flex items-center gap-1 text-xs mb-4 ${changeColor}`}>
          {changeIcon}
          30-yr {describeChange(rates.weekChange30yr)}
        </p>
      )}

      <p className="text-xs text-gray-500 mb-4">
        Source: Freddie Mac PMMS · Rates updated weekly · Your rate will vary based on credit, loan type, and lender.
      </p>

      {showCTA && (
        <a
          href="/book"
          className="block w-full rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Lock In Your Rate — Free Consult
        </a>
      )}
    </div>
  );
}
