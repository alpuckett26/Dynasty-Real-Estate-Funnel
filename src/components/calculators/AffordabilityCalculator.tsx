'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function calcMaxLoan(monthlyPayment: number, annualRate: number, termYears: number) {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return monthlyPayment * n;
  return (monthlyPayment * (1 - Math.pow(1 + r, -n))) / r;
}

export function AffordabilityCalculator() {
  const [income, setIncome] = useState(65000);
  const [debts, setDebts] = useState(400);
  const [downPayment, setDownPayment] = useState(15000);
  const [rate, setRate] = useState(7.0);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [dtiTarget, setDtiTarget] = useState<'conservative' | 'standard' | 'max'>('standard');

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => { if (data.rate30yr) { setRate(parseFloat(data.rate30yr.toFixed(2))); setLiveRate(parseFloat(data.rate30yr.toFixed(2))); } })
      .catch(() => {});
  }, []);

  const monthlyGross = income / 12;

  const dtiMap = { conservative: 0.25, standard: 0.28, max: 0.43 };
  const backEndMap = { conservative: 0.33, standard: 0.36, max: 0.50 };

  const maxFromFront = monthlyGross * dtiMap[dtiTarget];
  const maxFromBack = monthlyGross * backEndMap[dtiTarget] - debts;
  const maxHousing = Math.max(0, Math.min(maxFromFront, maxFromBack));

  // Back out taxes + insurance to get max P&I
  const estTaxInsurance = 250; // rough monthly estimate
  const maxPI = Math.max(0, maxHousing - estTaxInsurance);

  const maxLoan = calcMaxLoan(maxPI, rate, 30);
  const maxHomePrice = maxLoan + downPayment;

  const comfortablePrice = maxHomePrice * 0.85; // suggest 85% of max for comfort

  const frontDTI = ((maxHousing / monthlyGross) * 100).toFixed(0);
  const backDTI = (((maxHousing + debts) / monthlyGross) * 100).toFixed(0);

  const ranges = [
    { label: 'Conservative', desc: 'Comfortable, low stress', price: maxHomePrice * 0.75, color: 'text-emerald-600' },
    { label: 'Recommended', desc: 'Right balance of home and life', price: comfortablePrice, color: 'text-brand-600' },
    { label: 'Maximum', desc: 'What you may qualify for', price: maxHomePrice, color: 'text-amber-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* Inputs */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-7">

          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">Annual Household Income</label>
              <span className="text-sm font-semibold text-navy-950">{fmt(income)}</span>
            </div>
            <input type="range" min={30000} max={300000} step={1000} value={income}
              onChange={e => setIncome(Number(e.target.value))} className="w-full accent-brand-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$30k</span><span>$300k</span></div>
            <p className="text-xs text-gray-400 mt-1.5">Monthly gross: <span className="font-medium text-navy-700">{fmt(income / 12)}/mo</span></p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">Monthly Debt Payments</label>
              <span className="text-sm font-semibold text-navy-950">{fmt(debts)}/mo</span>
            </div>
            <input type="range" min={0} max={3000} step={50} value={debts}
              onChange={e => setDebts(Number(e.target.value))} className="w-full accent-brand-600" />
            <p className="text-xs text-gray-400 mt-1.5">Car, student loans, credit card minimums, etc.</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">Down Payment Saved</label>
              <span className="text-sm font-semibold text-navy-950">{fmt(downPayment)}</span>
            </div>
            <input type="range" min={0} max={100000} step={500} value={downPayment}
              onChange={e => setDownPayment(Number(e.target.value))} className="w-full accent-brand-600" />
            <p className="text-xs text-gray-400 mt-1.5">Don&apos;t have much saved? <Link href="/down-payment-assistance" className="text-brand-500 hover:underline">Check DPA programs →</Link></p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="label mb-0">
                Interest Rate
                {liveRate && <span className="ml-2 text-xs text-brand-500 font-normal">Live: {liveRate}%</span>}
              </label>
              <span className="text-sm font-semibold text-navy-950">{rate.toFixed(2)}%</span>
            </div>
            <input type="range" min={4} max={10} step={0.05} value={rate}
              onChange={e => setRate(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>

          {/* DTI target */}
          <div>
            <label className="label mb-3">How much house do you want?</label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'standard', 'max'] as const).map(t => (
                <button key={t} onClick={() => setDtiTarget(t)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all capitalize ${dtiTarget === t ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {t === 'conservative' ? 'Comfortable' : t === 'standard' ? 'Balanced' : 'Maximum'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {dtiTarget === 'conservative' ? '25% front-end DTI — leaves plenty of room for life' :
               dtiTarget === 'standard' ? '28% front-end DTI — standard lender guideline' :
               '43% back-end DTI — maximum most lenders allow'}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* Main result */}
          <div className="bg-brand-600 rounded-3xl p-7 text-white">
            <p className="text-sm font-medium text-white/70 mb-1">Recommended Max Home Price</p>
            <p className="font-serif text-4xl font-bold tracking-tight">{fmt(comfortablePrice)}</p>
            <p className="text-xs text-white/50 mt-2">{fmt(maxHousing)}/mo total housing cost</p>
          </div>

          {/* Ranges */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Price Ranges</p>
            {ranges.map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                <span className={`text-sm font-bold ${r.color}`}>{fmt(r.price)}</span>
              </div>
            ))}
          </div>

          {/* DTI breakdown */}
          <div className="bg-navy-50 rounded-3xl border border-navy-100 p-6 space-y-3">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-widest">Your DTI Ratios</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Front-end (housing)</span>
              <span className={`font-semibold ${Number(frontDTI) <= 28 ? 'text-emerald-600' : 'text-amber-600'}`}>{frontDTI}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Back-end (all debts)</span>
              <span className={`font-semibold ${Number(backDTI) <= 43 ? 'text-emerald-600' : 'text-red-500'}`}>{backDTI}%</span>
            </div>
            <div className="flex justify-between text-sm border-t border-navy-100 pt-3">
              <span className="text-gray-500">Max loan amount</span>
              <span className="font-semibold text-navy-950">{fmt(maxLoan)}</span>
            </div>
          </div>

          <Link href="/register" className="btn-primary w-full justify-center text-sm">
            Get Pre-Approved <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Estimates only. Actual qualification depends on credit, loan type, and lender guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
