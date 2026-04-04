'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, TrendingUp, DollarSign, CreditCard, MapPin, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface ProgressData {
  found: boolean;
  contactId?: string;
  firstName?: string;
  creditScore?: number | null;
  creditScoreGoal?: number;
  savings?: number | null;
  savingsGoal?: number;
  debts?: number | null;
  lastCheckin?: string;
  notes?: string;
  enrolledDate?: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ScoreBar({ current, goal }: { current: number | null; goal: number }) {
  const MILESTONES = [580, 620, 640, 680, 720];
  const min = 500;
  const max = 750;
  const pct = current ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100)) : 0;
  const goalPct = Math.min(100, Math.max(0, ((goal - min) / (max - min)) * 100));

  return (
    <div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-visible mb-2">
        {/* Goal marker */}
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-300 rounded-full z-10"
          style={{ left: `${goalPct}%` }} />
        {/* Progress */}
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      {/* Milestone markers */}
      <div className="relative h-5">
        {MILESTONES.map(score => {
          const p = ((score - min) / (max - min)) * 100;
          return (
            <div key={score} className="absolute flex flex-col items-center" style={{ left: `${p}%`, transform: 'translateX(-50%)' }}>
              <div className={`w-1 h-1 rounded-full mb-0.5 ${current && current >= score ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="text-[9px] text-gray-400 whitespace-nowrap">{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavingsBar({ current, goal }: { current: number | null; goal: number }) {
  const pct = current ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{current ? fmt(current) : '$0'} saved</span>
        <span>Goal: {fmt(goal)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% of goal</p>
    </div>
  );
}

function HUDCounselors({ zip }: { zip: string }) {
  const [counselors, setCounselors] = useState<{ name: string; address: string; phone: string; website: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/credit-path/hud-counselors?zip=${zip}`);
      const data = await res.json();
      setCounselors(data.counselors || []);
      if (data.fallbackUrl) setFallbackUrl(data.fallbackUrl);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }

  if (!fetched) {
    return (
      <button onClick={load} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" /> Find free HUD counselors near you
      </button>
    );
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-brand-500" />;

  if (counselors.length === 0 && fallbackUrl) {
    return <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">Find HUD counselors on hud.gov →</a>;
  }

  return (
    <div className="space-y-2">
      {counselors.map((c, i) => (
        <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
          <p className="font-semibold text-navy-800">{c.name}</p>
          <p>{c.address}</p>
          {c.phone && <p>{c.phone}</p>}
          {c.website && <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Website →</a>}
        </div>
      ))}
    </div>
  );
}

export function CreditPathTracker() {
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [step, setStep] = useState<'lookup' | 'loading' | 'dashboard' | 'not_found' | 'checkin' | 'saved'>('lookup');
  const [data, setData] = useState<ProgressData | null>(null);

  // Checkin form state
  const [checkinScore, setCheckinScore] = useState('');
  const [checkinSavings, setCheckinSavings] = useState('');
  const [checkinDebts, setCheckinDebts] = useState('');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const lookup = useCallback(async () => {
    if (!email.trim()) return;
    setStep('loading');
    try {
      const res = await fetch(`/api/credit-path/status?email=${encodeURIComponent(email)}`);
      const d = await res.json();
      setData(d);
      setStep(d.found ? 'dashboard' : 'not_found');
      if (d.creditScore) setCheckinScore(String(d.creditScore));
      if (d.savings) setCheckinSavings(String(d.savings));
      if (d.debts) setCheckinDebts(String(d.debts));
    } catch {
      setStep('not_found');
    }
  }, [email]);

  async function saveCheckin() {
    setSaving(true);
    try {
      await fetch('/api/credit-path/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          creditScore: checkinScore ? Number(checkinScore) : undefined,
          savings: checkinSavings ? Number(checkinSavings) : undefined,
          debts: checkinDebts ? Number(checkinDebts) : undefined,
          notes: checkinNotes || undefined,
        }),
      });
      // Refresh data
      const res = await fetch(`/api/credit-path/status?email=${encodeURIComponent(email)}`);
      const d = await res.json();
      setData(d);
      setStep('saved');
      setTimeout(() => setStep('dashboard'), 2500);
    } finally {
      setSaving(false);
    }
  }

  // ── Lookup form ──────────────────────────────────────────────────────────────
  if (step === 'lookup') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="font-serif text-2xl font-bold text-navy-950 mb-2">Load your dashboard</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the email address you used when signing up with Adreanne.</p>
          <div className="space-y-4">
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              className="input-field" />
            <button onClick={lookup} disabled={!email.trim()}
              className="btn-primary w-full justify-center">
              Load My Progress <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-5 text-xs text-center text-gray-400">
            Not on the path yet?{' '}
            <Link href="/get-ready" className="text-brand-600 hover:underline">Register here →</Link>
          </p>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (step === 'not_found') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-navy-950 font-semibold mb-2">Email not found</p>
        <p className="text-sm text-gray-500 mb-6">
          We don&apos;t have a record for <strong>{email}</strong>. Make sure you use the same email you gave Adreanne, or register to get started.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => setStep('lookup')} className="btn-outline-dark text-sm justify-center flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Try a different email
          </button>
          <Link href="/get-ready" className="btn-primary text-sm justify-center">
            Register for the Credit Path
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'saved') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <p className="font-serif text-2xl font-bold text-navy-950 mb-2">Progress saved!</p>
        <p className="text-sm text-gray-500">Adreanne can now see your latest numbers. Loading your dashboard...</p>
      </div>
    );
  }

  // ── Check-in form ────────────────────────────────────────────────────────────
  if (step === 'checkin') {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-navy-950">Monthly Check-In</h2>
          <button onClick={() => setStep('dashboard')} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="label">Current Credit Score</label>
            <input type="number" placeholder="e.g. 612" value={checkinScore}
              onChange={e => setCheckinScore(e.target.value)} className="input-field" />
            <p className="text-xs text-gray-400 mt-1">Check Credit Karma, your bank app, or Experian for free</p>
          </div>
          <div>
            <label className="label">Total Savings (Down Payment Fund)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" placeholder="0" value={checkinSavings}
                onChange={e => setCheckinSavings(e.target.value)} className="input-field pl-8" />
            </div>
          </div>
          <div>
            <label className="label">Total Outstanding Debt</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" placeholder="0" value={checkinDebts}
                onChange={e => setCheckinDebts(e.target.value)} className="input-field pl-8" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Credit cards + car + student loans total balance</p>
          </div>
          <div>
            <label className="label">Notes for Adreanne (optional)</label>
            <textarea placeholder="Any questions, updates, or things you want her to know..." value={checkinNotes}
              onChange={e => setCheckinNotes(e.target.value)}
              className="input-field resize-none h-20" />
          </div>
          <button onClick={saveCheckin} disabled={saving}
            className="btn-primary w-full justify-center">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save My Progress <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const d = data!;
  const scoreGood = d.creditScore && d.creditScore >= 640;
  const savingsGood = d.savings && d.savingsGoal && d.savings >= d.savingsGoal * 0.8;
  const readyToMove = scoreGood && savingsGood;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Your Credit Path</p>
            <h2 className="font-serif text-2xl font-bold text-navy-950">
              {d.firstName ? `Hey ${d.firstName} 👋` : 'Your Dashboard'}
            </h2>
            {d.lastCheckin && (
              <p className="text-xs text-gray-400 mt-1">
                Last check-in: {new Date(d.lastCheckin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('checkin')}
              className="rounded-full bg-brand-600 text-white text-xs font-semibold px-4 py-2 hover:bg-brand-700 transition-colors">
              Monthly Check-In
            </button>
            <button onClick={() => setStep('lookup')}
              className="rounded-full border border-gray-200 text-gray-500 text-xs font-semibold px-4 py-2 hover:bg-gray-50 transition-colors">
              Switch Account
            </button>
          </div>
        </div>

        {readyToMove && (
          <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">You may be ready to buy!</p>
              <p className="text-xs text-emerald-700">Your score and savings are looking strong. Time to talk to Adreanne.</p>
            </div>
            <Link href="/book" className="ml-auto flex-shrink-0 rounded-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 hover:bg-emerald-700 transition-colors">
              Book a Call
            </Link>
          </div>
        )}
      </div>

      {/* Credit Score */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-950">Credit Score</h3>
            <p className="text-xs text-gray-400">Goal: {d.creditScoreGoal}</p>
          </div>
          {d.creditScore && (
            <div className="ml-auto text-right">
              <p className="font-serif text-3xl font-bold text-navy-950">{d.creditScore}</p>
              <p className="text-xs text-gray-400">current</p>
            </div>
          )}
        </div>
        {d.creditScore ? (
          <ScoreBar current={d.creditScore} goal={d.creditScoreGoal || 640} />
        ) : (
          <p className="text-sm text-gray-400 italic">No score recorded yet. Do a check-in to add yours.</p>
        )}
      </div>

      {/* Savings */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-navy-950">Down Payment Savings</h3>
        </div>
        {d.savings !== null && d.savings !== undefined ? (
          <SavingsBar current={d.savings} goal={d.savingsGoal || 10000} />
        ) : (
          <p className="text-sm text-gray-400 italic">No savings recorded yet. Do a check-in to add yours.</p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Remember: down payment assistance can cover most or all of this.{' '}
          <Link href="/down-payment-assistance" className="text-brand-500 hover:underline">Check eligibility →</Link>
        </p>
      </div>

      {/* Debt */}
      {d.debts !== null && d.debts !== undefined && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-950">Outstanding Debt</h3>
              <p className="text-xs text-gray-400">Lower is better for your DTI ratio</p>
            </div>
            <p className="ml-auto font-serif text-2xl font-bold text-navy-950">{fmt(d.debts)}</p>
          </div>
        </div>
      )}

      {/* HUD Counselors */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <h3 className="font-semibold text-navy-950 mb-2">Free Housing Counselors Near You</h3>
        <p className="text-xs text-gray-400 mb-4">HUD-approved counselors offer free credit and homebuying guidance.</p>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Your ZIP code" value={zip}
            onChange={e => setZip(e.target.value)} className="input-field flex-1 py-2 text-sm" maxLength={5} />
        </div>
        <HUDCounselors zip={zip || '70801'} />
      </div>
    </div>
  );
}
