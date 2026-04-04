import type { Metadata } from 'next';
import { AffordabilityCalculator } from '@/components/calculators/AffordabilityCalculator';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Much House Can I Afford? | Affordability Calculator',
  description: 'Find out exactly how much home you can afford based on your income, debts, and down payment — using the same formula lenders use.',
};

export default function AffordabilityPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-narrow text-center">
          <p className="section-label text-brand-400 mb-4">Free Tool</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
            How much home can<br />you actually afford?
          </h1>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed font-light">
            Not what the internet says. Not a guess. The same formula lenders use — run with your real numbers.
          </p>
        </div>
      </section>

      {/* How lenders think */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">How lenders decide</p>
            <h2 className="section-title">The two ratios that determine what you qualify for</h2>
            <p className="mt-5 text-gray-500 leading-relaxed font-light">
              When you apply for a mortgage, lenders don&apos;t just look at your income. They look at two specific
              debt-to-income ratios that tell them how much of your paycheck is already committed to debt.
              Understanding these helps you know exactly where you stand before you ever talk to a lender.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-7">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-serif text-4xl font-bold text-brand-600">28%</span>
                  <span className="text-sm font-semibold text-brand-700">Front-End DTI</span>
                </div>
                <h3 className="font-semibold text-navy-950 mb-2">Housing ratio</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your total housing payment (mortgage + taxes + insurance + PMI) should be
                  <strong className="text-navy-950"> no more than 28%</strong> of your gross monthly income.
                  This is the first thing lenders check.
                </p>
                <div className="mt-4 bg-white rounded-xl p-3 text-xs text-gray-500">
                  Example: $5,000/mo income → max housing payment of <strong className="text-navy-800">$1,400/mo</strong>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-navy-200 bg-navy-50 p-7">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-serif text-4xl font-bold text-navy-700">36–43%</span>
                  <span className="text-sm font-semibold text-navy-600">Back-End DTI</span>
                </div>
                <h3 className="font-semibold text-navy-950 mb-2">Total debt ratio</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All your monthly debts combined (housing + car + student loans + credit cards)
                  should be <strong className="text-navy-950">no more than 36–43%</strong> of gross income.
                  FHA allows up to 50% in some cases.
                </p>
                <div className="mt-4 bg-white rounded-xl p-3 text-xs text-gray-500">
                  Example: $5,000/mo income, $400 in debts → max housing of <strong className="text-navy-800">$1,400/mo</strong>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-navy-950 p-7 text-white">
              <h3 className="font-serif text-xl font-bold mb-3">What most people get wrong</h3>
              <p className="text-white/75 text-sm leading-relaxed">
                Most online calculators show you the maximum you <em>might</em> qualify for. That&apos;s not the same as what you should spend.
                A lender approving you for $350,000 doesn&apos;t mean you&apos;ll be comfortable at $350,000.
                <strong className="text-white"> I always recommend targeting 20–25% of take-home pay</strong> for housing costs, not gross income.
                That leaves room for life — repairs, savings, emergencies, and actually enjoying your home.
              </p>
            </div>

            {/* What counts as debt */}
            <div className="mt-10">
              <h3 className="font-serif text-2xl font-bold text-navy-950 mb-5">What counts as &quot;debt&quot; to a lender?</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Car loan or lease payments', yes: true },
                  { label: 'Student loan minimum payments', yes: true },
                  { label: 'Credit card minimum payments', yes: true },
                  { label: 'Personal loan payments', yes: true },
                  { label: 'Child support / alimony', yes: true },
                  { label: 'Other mortgage payments', yes: true },
                  { label: 'Utilities (electric, water, etc.)', yes: false },
                  { label: 'Groceries and subscriptions', yes: false },
                  { label: 'Cell phone bills', yes: false },
                  { label: 'Insurance premiums', yes: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${item.yes ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {item.yes ? '✕' : '✓'}
                    </span>
                    <span className={item.yes ? 'text-navy-800' : 'text-gray-500'}>{item.label}</span>
                    <span className={`text-xs font-medium ${item.yes ? 'text-red-500' : 'text-green-600'}`}>{item.yes ? 'Counts' : 'Doesn\'t count'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Your Numbers</p>
            <h2 className="section-title">Find your affordability range</h2>
            <p className="section-subtitle max-w-md mx-auto">Uses the same formula lenders use. Pre-filled with today&apos;s rate.</p>
          </div>
          <AffordabilityCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Now let&apos;s make it real</h2>
          <p className="mt-3 text-white/50 font-light max-w-md mx-auto">
            Get pre-approved in 24–48 hours. Adreanne will connect you with the right lender for your situation.
          </p>
          <div className="mt-7 flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="btn-primary text-sm">
              Get Pre-Approved <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/down-payment-assistance" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all">
              Check DPA Eligibility
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {['No credit pull to get started', 'Free lender matching', 'Up to $15k in DPA available'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-white/40">
                <CheckCircle className="h-3 w-3 text-brand-400" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
