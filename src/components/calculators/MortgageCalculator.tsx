'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function calcMonthly(principal: number, annualRate: number, termYears: number) {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState(250000);
  const [downPct, setDownPct] = useState(10);
  const [rate, setRate] = useState(7.0);
  const [term, setTerm] = useState(30);
  const [taxRate, setTaxRate] = useState(0.7);   // % of home value annually
  const [insurance, setInsurance] = useState(150); // $/month
  const [liveRate, setLiveRate] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.rate30yr) {
          setRate(parseFloat(data.rate30yr.toFixed(2)));
          setLiveRate(parseFloat(data.rate30yr.toFixed(2)));
        }
      })
      .catch(() => {});
  }, []);

  const downAmount = Math.round(homePrice * (downPct / 100));
  const principal = homePrice - downAmount;
  const pi = calcMonthly(principal, rate, term);
  const monthlyTax = (homePrice * (taxRate / 100)) / 12;
  const pmi = downPct < 20 ? (principal * 0.008) / 12 : 0; // ~0.8% annually
  const total = pi + monthlyTax + insurance + pmi;
  const totalPaid = (pi * term * 12) + downAmount;
  const totalInterest = pi * term * 12 - principal;

  const [slider, setSlider] = useState(250000);

  const handlePriceInput = useCallback((val: string) => {
    const n = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setHomePrice(n);
    setSlider(n);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

        {/* Inputs */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-7">

          {/* Home Price */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="label mb-0">Home Price</label>
              <input
                type="text"
                value={formatCurrency(homePrice)}
                onChange={e => handlePriceInput(e.target.value)}
                className="w-36 text-right border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-navy-950 focus:outline-none focus:border-brand-400"
              />
            </div>
            <input
              type="range" min={50000} max={1000000} step={5000}
              value={slider}
              onChange={e => { const v = Number(e.target.value); setSlider(v); setHomePrice(v); }}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$50k</span><span>$1M</span>
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="label mb-0">Down Payment</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{formatCurrency(downAmount)}</span>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  {[3, 5, 10, 20].map(p => (
                    <button
                      key={p}
                      onClick={() => setDownPct(p)}
                      className={`px-2.5 py-1 text-xs font-semibold transition-colors ${downPct === p ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <input
              type="range" min={3} max={50} step={1}
              value={downPct}
              onChange={e => setDownPct(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3%</span>
              {downPct < 20 && <span className="text-amber-500 font-medium">PMI applies under 20%</span>}
              <span>50%</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="label mb-0">
                Interest Rate
                {liveRate && <span className="ml-2 text-xs text-brand-500 font-normal">Live: {liveRate}%</span>}
              </label>
              <span className="text-sm font-semibold text-navy-950">{rate.toFixed(2)}%</span>
            </div>
            <input
              type="range" min={3} max={12} step={0.05}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3%</span><span>12%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <label className="label">Loan Term</label>
            <div className="flex gap-2">
              {[10, 15, 20, 30].map(y => (
                <button
                  key={y}
                  onClick={() => setTerm(y)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${term === y ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {y} yr
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <details className="group">
            <summary className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Advanced (taxes & insurance)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0 text-xs">Property Tax Rate</label>
                  <span className="text-xs text-gray-500">{taxRate}% / yr · {formatCurrency(monthlyTax)}/mo</span>
                </div>
                <input type="range" min={0.3} max={2.5} step={0.05} value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full accent-brand-600" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0 text-xs">Homeowner&apos;s Insurance</label>
                  <span className="text-xs text-gray-500">{formatCurrency(insurance)}/mo</span>
                </div>
                <input type="range" min={50} max={400} step={10} value={insurance}
                  onChange={e => setInsurance(Number(e.target.value))}
                  className="w-full accent-brand-600" />
              </div>
            </div>
          </details>
        </div>

        {/* Results */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* Monthly total */}
          <div className="bg-brand-600 rounded-3xl p-7 text-white">
            <p className="text-sm font-medium text-white/70 mb-1">Est. Monthly Payment</p>
            <p className="font-serif text-5xl font-bold tracking-tight">{formatCurrency(total)}</p>
            <p className="text-xs text-white/50 mt-2">Includes P&I, tax, insurance{pmi > 0 ? ', PMI' : ''}</p>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
            {[
              { label: 'Principal & Interest', value: pi, sub: `${((pi/total)*100).toFixed(0)}% of payment` },
              { label: 'Property Tax', value: monthlyTax, sub: `${taxRate}% annually` },
              { label: 'Insurance', value: insurance, sub: 'Est. homeowner\'s policy' },
              ...(pmi > 0 ? [{ label: 'PMI', value: pmi, sub: 'Removed at 20% equity' }] : []),
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <span className="text-sm font-semibold text-navy-950">{formatCurrency(item.value)}/mo</span>
              </div>
            ))}
          </div>

          {/* Lifetime stats */}
          <div className="bg-navy-50 rounded-3xl border border-navy-100 p-6 space-y-3">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-widest mb-3">Over {term} Years</p>
            {[
              { label: 'Loan Amount', value: formatCurrency(principal) },
              { label: 'Total Interest', value: formatCurrency(totalInterest) },
              { label: 'Total Cost (incl. down)', value: formatCurrency(totalPaid) },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-navy-950">{item.value}</span>
              </div>
            ))}
          </div>

          <Link href="/register" className="btn-primary w-full justify-center text-sm">
            Get Pre-Approved <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
