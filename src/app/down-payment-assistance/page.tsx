import type { Metadata } from 'next';
import { DPAChecker } from '@/components/calculators/DPAChecker';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Down Payment Assistance | Am I Eligible? | Adreanne The Realtor',
  description: 'Most buyers don\'t know they qualify for down payment assistance. Check your eligibility for Louisiana programs that can contribute up to $15,000.',
};

const PROGRAMS = [
  {
    name: 'Louisiana Housing Corporation — GSFA Platinum',
    amount: 'Up to $15,000',
    type: 'Grant (no repayment)',
    who: 'First-time buyers and repeat buyers in targeted areas',
    income: 'Income limits apply (~$85–110k depending on household size)',
    credit: 'Minimum 640 credit score',
    color: 'border-brand-200 bg-brand-50',
    badge: 'bg-brand-100 text-brand-700',
  },
  {
    name: 'Louisiana Housing Corporation — LACAA',
    amount: 'Up to $10,000',
    type: 'Soft second loan (forgiven after 3 years)',
    who: 'First-time homebuyers only',
    income: 'Income limits apply (~80% of Area Median Income)',
    credit: 'Minimum 620 credit score',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'HUD-Approved Homebuyer Assistance',
    amount: 'Varies by program',
    type: 'Grant or deferred loan',
    who: 'Income-qualified buyers in specific zip codes',
    income: 'Up to 80% AMI',
    credit: 'Minimum 580 (FHA) or 620 (conventional)',
    color: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Healthcare Hero Programs',
    amount: 'Varies by lender',
    type: 'Rate discount + closing cost credit',
    who: 'Nurses, doctors, EMTs, healthcare workers',
    income: 'No income cap on most programs',
    credit: 'Minimum 620 credit score',
    color: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
  },
];

const MYTHS = [
  { myth: '"DPA is only for low-income buyers."', fact: 'Many programs extend to moderate incomes — households earning up to $110,000+ qualify for some Louisiana programs.' },
  { myth: '"I used it once so I can\'t use it again."', fact: 'Some programs are available to repeat buyers. And if you\'ve never owned a home in the past 3 years, you may qualify as a first-time buyer again.' },
  { myth: '"It\'s a loan I have to pay back."', fact: 'Many DPA programs are grants — free money with no repayment. Others are soft second loans forgiven after 3–5 years if you stay in the home.' },
  { myth: '"It takes forever and complicates the process."', fact: 'With an agent who knows these programs (like Adreanne), DPA is built into your purchase process from day one. It doesn\'t slow anything down.' },
];

export default function DownPaymentAssistancePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-narrow text-center">
          <p className="section-label text-brand-400 mb-4">Free Programs</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
            You may qualify for free<br />down payment money.
          </h1>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed font-light">
            Most buyers don&apos;t know these programs exist. I help clients use them every week — and it changes everything.
          </p>
        </div>
      </section>

      {/* What is DPA */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">What is DPA?</p>
            <h2 className="section-title">Down payment assistance, explained simply.</h2>
            <p className="mt-5 text-gray-500 leading-relaxed font-light">
              Down payment assistance (DPA) is money from government agencies, nonprofits, or lenders
              given to homebuyers to help cover their down payment and sometimes closing costs.
              It can be a <strong className="text-navy-950 font-semibold">grant</strong> (never repaid),
              a <strong className="text-navy-950 font-semibold">soft second loan</strong> (forgiven after a few years),
              or a <strong className="text-navy-950 font-semibold">deferred loan</strong> (paid back only when you sell or refinance).
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed font-light">
              The challenge? These programs have strict eligibility requirements, limited funding windows, and
              most agents don&apos;t know how to navigate them. I&apos;ve done it dozens of times. I know which programs
              are funded right now and which lenders to use.
            </p>

            {/* Key stat */}
            <div className="mt-10 grid sm:grid-cols-3 gap-5">
              {[
                { value: '$15,000', label: 'Maximum assistance in Louisiana programs' },
                { value: '87%', label: 'Of buyers who check actually qualify for some program' },
                { value: '$0', label: 'Cost to find out what you qualify for' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-navy-50 border border-navy-100 p-5 text-center">
                  <p className="font-serif text-3xl font-bold text-brand-600">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Myth busting */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-title text-center mb-10">4 myths keeping buyers from free money</h2>
            <div className="space-y-4">
              {MYTHS.map((m) => (
                <div key={m.myth} className="card">
                  <p className="text-sm font-semibold text-gray-400 italic mb-2">{m.myth}</p>
                  <p className="text-sm text-navy-800 leading-relaxed">
                    <span className="text-brand-600 font-semibold">The truth: </span>{m.fact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs breakdown */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Louisiana Programs</p>
            <h2 className="section-title">Programs Adreanne works with</h2>
            <p className="section-subtitle max-w-md mx-auto">These are real programs, currently funded, that Adreanne uses for her clients.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-5">
            {PROGRAMS.map((p) => (
              <div key={p.name} className={`rounded-2xl border p-6 ${p.color}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <h3 className="font-serif font-bold text-navy-950 text-lg">{p.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`badge ${p.badge}`}>{p.amount}</span>
                    <span className="badge bg-white/60 text-gray-600 border border-gray-200">{p.type}</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
                  {[
                    { label: 'Who', val: p.who },
                    { label: 'Income', val: p.income },
                    { label: 'Credit', val: p.credit },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                      <p className="text-sm text-navy-800">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto">
            Program availability and funding change frequently. Adreanne verifies current status before recommending any program.
          </p>
        </div>
      </section>

      {/* Eligibility Checker */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Quick Check</p>
            <h2 className="section-title">Do you likely qualify?</h2>
            <p className="section-subtitle max-w-md mx-auto">Answer 5 questions. Get an honest read in 30 seconds.</p>
          </div>
          <DPAChecker />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Ready to find out for real?</h2>
          <p className="mt-3 text-white/50 font-light max-w-md mx-auto">
            A 20-minute call with Adreanne will tell you exactly which programs you qualify for and how much you can get.
          </p>
          <div className="mt-7 flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary text-sm">
              Book Free Consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {['Free to check', 'No credit pull required', 'Results within 24 hours'].map(item => (
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
