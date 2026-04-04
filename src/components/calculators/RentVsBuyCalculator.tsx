'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Home } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function calcMonthly(principal: number, annualRate: number, termYears: number) {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function RentVsBuyCalculator() {
  const [rent, setRent] = useState(1400);
  const [homePrice, setHomePrice] = useState(250000);
  const [downPct, setDownPct] = useState(10);
  const [rate, setRate] = useState(7.0);
  const [rentIncrease, setRentIncrease] = useState(3);
  const [appreciation, setAppreciation] = useState(3.5);
  const [years, setYears] = useState(7);

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => { if (data.rate30yr) setRate(parseFloat(data.rate30yr.toFixed(2))); })
      .catch(() => {});
  }, []);

  const downAmount = homePrice * (downPct / 100);
  const principal = homePrice - downAmount;
  const pi = calcMonthly(principal, rate, 30);
  const monthlyTax = (homePrice * 0.007) / 12;
  const insurance = 140;
  const pmi = downPct < 20 ? (principal * 0.008) / 12 : 0;
  const monthlyBuy = pi + monthlyTax + insurance + pmi;

  // Rent total over N years (with annual increases)
  let totalRent = 0;
  let currentRent = rent;
  for (let y = 0; y < years; y++) {
    totalRent += currentRent * 12;
    currentRent *= 1 + rentIncrease / 100;
  }

  // Buy total over N years
  const totalMortgagePaid = monthlyBuy * 12 * years;
  const totalBuyCosts = totalMortgagePaid + downAmount;

  // Equity built: appreciation + principal paid down
  const futureValue = homePrice * Math.pow(1 + appreciation / 100, years);
  // Remaining balance after N years
  const r = rate / 100 / 12;
  const n = 360;
  const p = years * 12;
  const remainingBalance = r > 0
    ? principal * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1)
    : principal - (principal / n) * p;
  const equity = futureValue - remainingBalance;

  // Net cost of buying = total paid - equity recouped (assuming you sell)
  const netBuyCost = totalBuyCosts - equity;
  const diff = totalRent - netBuyCost;
  const buyWins = diff > 0;

  const breakEvenYear = (() => {
    let cumRent = 0, cumBuy = 0, cr = rent;
    for (let y = 1; y <= 30; y++) {
      cumRent += cr * 12;
      cumBuy += monthlyBuy * 12;
      // Equity at year y
      const fv = homePrice * Math.pow(1 + appreciation / 100, y);
      const rem = r > 0
        ? principal * (Math.pow(1 + r, n) - Math.pow(1 + r, y * 12)) / (Math.pow(1 + r, n) - 1)
        : principal - (principal / n) * (y * 12);
      const eq = fv - rem;
      if (cumRent > (cumBuy + downAmount - eq)) return y;
      cr *= 1 + rentIncrease / 100;
    }
    return null;
  })();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* Inputs */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-7">

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="label mb-0">Monthly Rent</label>
                <span className="text-sm font-semibold text-navy-950">{fmt(rent)}</span>
              </div>
              <input type="range" min={500} max={4000} step={50} value={rent}
                onChange={e => setRent(Number(e.target.value))} className="w-full accent-brand-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$500</span><span>$4,000</span></div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="label mb-0">Annual Rent Increase</label>
                <span className="text-sm font-semibold text-navy-950">{rentIncrease}%</span>
              </div>
              <input type="range" min={0} max={8} step={0.5} value={rentIncrease}
                onChange={e => setRentIncrease(Number(e.target.value))} className="w-full accent-brand-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>8%</span></div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">If You Buy</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Home Price</label>
                  <span className="text-sm font-semibold text-navy-950">{fmt(homePrice)}</span>
                </div>
                <input type="range" min={100000} max={750000} step={5000} value={homePrice}
                  onChange={e => setHomePrice(Number(e.target.value))} className="w-full accent-brand-600" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Down Payment</label>
                  <span className="text-sm font-semibold text-navy-950">{downPct}% · {fmt(downAmount)}</span>
                </div>
                <input type="range" min={3} max={30} step={1} value={downPct}
                  onChange={e => setDownPct(Number(e.target.value))} className="w-full accent-brand-600" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Interest Rate</label>
                  <span className="text-sm font-semibold text-navy-950">{rate.toFixed(2)}%</span>
                </div>
                <input type="range" min={4} max={10} step={0.05} value={rate}
                  onChange={e => setRate(Number(e.target.value))} className="w-full accent-brand-600" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="label mb-0">Annual Appreciation</label>
                  <span className="text-sm font-semibold text-navy-950">{appreciation}%</span>
                </div>
                <input type="range" min={0} max={8} step={0.5} value={appreciation}
                  onChange={e => setAppreciation(Number(e.target.value))} className="w-full accent-brand-600" />
              </div>
            </div>
          </div>

          {/* Years */}
          <div>
            <label className="label mb-3">How long will you stay?</label>
            <div className="flex gap-2">
              {[3, 5, 7, 10, 15, 20].map(y => (
                <button key={y} onClick={() => setYears(y)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${years === y ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {y}y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* Winner */}
          <div className={`rounded-3xl p-7 text-white ${buyWins ? 'bg-brand-600' : 'bg-navy-700'}`}>
            <div className="flex items-center gap-2 mb-3">
              {buyWins ? <Home className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              <span className="text-sm font-semibold">Over {years} years</span>
            </div>
            <p className="text-lg font-semibold mb-1">{buyWins ? 'Buying saves you' : 'Renting saves you'}</p>
            <p className="font-serif text-4xl font-bold tracking-tight">{fmt(Math.abs(diff))}</p>
            <p className="text-xs text-white/50 mt-2">vs. the alternative</p>
          </div>

          {/* Comparison */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-navy-800">Total Rent Paid</p>
                <p className="text-xs text-gray-400">Including {rentIncrease}%/yr increases</p>
              </div>
              <span className="text-sm font-bold text-navy-950">{fmt(totalRent)}</span>
            </div>
            <div className="flex items-start justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-navy-800">Total Buy Costs</p>
                <p className="text-xs text-gray-400">Down payment + all payments</p>
              </div>
              <span className="text-sm font-bold text-navy-950">{fmt(totalBuyCosts)}</span>
            </div>
            <div className="flex items-start justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Equity Built</p>
                <p className="text-xs text-gray-400">Appreciation + principal paid</p>
              </div>
              <span className="text-sm font-bold text-emerald-700">+{fmt(equity)}</span>
            </div>
            <div className="flex items-start justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-navy-800">Net Buy Cost</p>
                <p className="text-xs text-gray-400">Total paid minus equity</p>
              </div>
              <span className="text-sm font-bold text-navy-950">{fmt(netBuyCost)}</span>
            </div>
          </div>

          {breakEvenYear && (
            <div className="bg-navy-50 rounded-2xl p-5 border border-navy-100 text-center">
              <p className="text-xs text-navy-500 uppercase tracking-widest font-semibold mb-1">Break-Even Point</p>
              <p className="font-serif text-3xl font-bold text-navy-950">Year {breakEvenYear}</p>
              <p className="text-xs text-gray-500 mt-1">After this, buying wins every year</p>
            </div>
          )}

          <Link href="/register" className="btn-primary w-full justify-center text-sm">
            Check What I Qualify For
          </Link>
        </div>
      </div>
    </div>
  );
}
