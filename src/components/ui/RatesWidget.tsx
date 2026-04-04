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
    const items = [
      `30-yr Fixed: ${formatRate(rates.rate30yr)}`,
      `15-yr Fixed: ${formatRate(rates.rate15yr)}`,
      `5/1 ARM: ${formatRate(rates.rate5arm)}`,
      ...(rates.weekChange30yr !== null ? [`30-yr ${describeChange(rates.weekChange30yr)}`] : []),
      `Rates as of ${asOfFormatted}`,
      ...(showCTA ? ['Get Pre-Approved →'] : []),
    ];

    // Duplicate for seamless infinite loop
    const allItems = [...items, ...items];

    return (
      <div className="bg-navy-950 border-b border-navy-800/60 py-2 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap will-change-transform">
          {allItems.map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className={`text-xs font-medium px-6 ${
                item.includes('→')
                  ? 'text-brand-400 font-semibold'
                  : item.startsWith('Rates as of')
                  ? 'text-gray-500'
                  : item.includes('down') || item.includes('lower')
                  ? 'text-green-400'
                  : item.includes('up') || item.includes('higher')
                  ? 'text-red-400'
                  : 'text-gray-200'
              }`}>
                {item}
              </span>
              <span className="text-navy-700 text-xs">·</span>
            </span>
          ))}
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
