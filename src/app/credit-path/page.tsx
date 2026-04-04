import type { Metadata } from 'next';
import { CreditPathTracker } from '@/components/credit-path/CreditPathTracker';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Credit Path | Track Your Journey to Homeownership',
  description: 'Track your credit score, savings, and debt paydown progress on your path to homeownership with Adreanne The Realtor.',
};

const MILESTONES = [
  { score: 580, label: 'FHA Eligible', desc: 'Qualify for FHA loans with as little as 3.5% down', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { score: 620, label: 'DPA Eligible', desc: 'Most down payment assistance programs unlock here', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { score: 640, label: 'GSFA Platinum', desc: 'Louisiana\'s primary $15k grant program requires 640+', color: 'bg-brand-100 text-brand-700 border-brand-200' },
  { score: 680, label: 'Best Rates', desc: 'Conventional loans + lowest available interest rates', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const SCORE_TIPS = [
  { range: 'Under 580', tips: ['Dispute any errors on your credit report at annualcreditreport.com', 'Pay all bills on time — even one late payment sets you back 60-90 days', 'Become an authorized user on a family member\'s good-standing card'] },
  { range: '580–619', tips: ['Pay down credit cards to below 30% of their limit', 'Don\'t close old accounts — length of history matters', 'Avoid applying for any new credit'] },
  { range: '620–659', tips: ['Get below 10% utilization on all cards for a bigger boost', 'Ask for a credit limit increase (without a hard pull)', 'Self Inc credit-builder loan can add 20-40 points over 12 months'] },
  { range: '660+', tips: ['You\'re in great shape — focus on saving your down payment', 'Keep utilization below 10%', 'Don\'t open new accounts in the 6 months before applying'] },
];

export default function CreditPathPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-narrow text-center">
          <p className="section-label text-brand-400 mb-4">Your Journey</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
            Track your path<br />to homeownership.
          </h1>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed font-light">
            Enter your email to load your personal dashboard. Update your numbers monthly so Adreanne can track your progress and tell you the moment you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Tracker */}
      <section className="py-16 bg-navy-50">
        <div className="container-wide">
          <CreditPathTracker />
        </div>
      </section>

      {/* Score milestones */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">The roadmap</p>
            <h2 className="section-title">Credit score milestones that matter</h2>
            <p className="mt-4 text-gray-500 leading-relaxed font-light">
              Each threshold unlocks something real — a loan type, a grant, a better rate. Here&apos;s exactly what you&apos;re working toward.
            </p>
            <div className="mt-10 space-y-4">
              {MILESTONES.map((m) => (
                <div key={m.score} className={`rounded-2xl border p-5 flex items-start gap-5 ${m.color}`}>
                  <div className="flex-shrink-0 text-center">
                    <p className="font-serif text-3xl font-bold">{m.score}</p>
                    <p className="text-xs font-semibold mt-0.5">{m.label}</p>
                  </div>
                  <div className="border-l border-current/20 pl-5">
                    <p className="text-sm leading-relaxed opacity-80">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tips by score range */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">How to improve</p>
            <h2 className="section-title">Specific tips for where you are right now</h2>
            <div className="mt-10 space-y-6">
              {SCORE_TIPS.map((s) => (
                <div key={s.range} className="card">
                  <p className="text-sm font-semibold text-navy-700 uppercase tracking-widest mb-4">Score: {s.range}</p>
                  <ul className="space-y-2.5">
                    {s.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">Free Resources</p>
            <h2 className="section-title">Tools Adreanne recommends</h2>
            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              {[
                {
                  name: 'Annual Credit Report',
                  desc: 'Pull your free report from all 3 bureaus. Look for errors — disputing them is the fastest free score boost.',
                  url: 'https://www.annualcreditreport.com',
                  cta: 'Get Free Report',
                  color: 'bg-blue-50 border-blue-100',
                },
                {
                  name: 'Self Inc',
                  desc: 'Credit-builder loan that reports to all 3 bureaus. Most clients see 20–40 point gains in 6–12 months.',
                  url: 'https://www.self.inc',
                  cta: 'Start Building',
                  color: 'bg-emerald-50 border-emerald-100',
                },
                {
                  name: 'HUD Counseling',
                  desc: 'Free or low-cost housing counseling from a HUD-approved advisor. Find one near you.',
                  url: 'https://www.hud.gov/counseling',
                  cta: 'Find a Counselor',
                  color: 'bg-brand-50 border-brand-100',
                },
              ].map((r) => (
                <div key={r.name} className={`rounded-2xl border p-6 ${r.color}`}>
                  <h3 className="font-serif font-bold text-navy-950 mb-2">{r.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.desc}</p>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:gap-2.5 transition-all">
                    {r.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Not on the path yet?</h2>
          <p className="mt-3 text-white/50 font-light max-w-md mx-auto">
            Adreanne will build you a personalized plan — free, no obligation.
          </p>
          <Link href="/get-ready" className="mt-7 inline-flex items-center gap-2 btn-primary text-sm">
            Start My Path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
