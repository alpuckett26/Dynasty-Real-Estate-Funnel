import type { Metadata } from 'next';
import { MortgageCalculator } from '@/components/calculators/MortgageCalculator';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mortgage Calculator | Understand Your Monthly Payment',
  description: 'See your real monthly payment broken down — principal, interest, taxes, and insurance. Pre-filled with today\'s live mortgage rates.',
};

const CONCEPTS = [
  {
    term: 'Principal',
    plain: 'The actual amount you borrowed.',
    detail: 'If you buy a $250,000 home and put 10% down, your principal is $225,000. Every payment chips away at this balance — slowly at first, faster later.',
  },
  {
    term: 'Interest',
    plain: 'The cost of borrowing money.',
    detail: 'Lenders charge a percentage of your remaining loan balance each month. In the early years, most of your payment is interest. By year 20, most is principal. This is called amortization.',
  },
  {
    term: 'Property Tax',
    plain: 'Annual tax on your home, paid monthly into escrow.',
    detail: 'In Louisiana, property taxes are among the lowest in the nation — typically 0.5–0.9% of home value per year. Your lender collects 1/12th each month and pays it on your behalf.',
  },
  {
    term: 'Homeowner\'s Insurance',
    plain: 'Protects your home from damage or loss.',
    detail: 'Required by lenders. In Louisiana, expect $1,200–2,000/year depending on location and coverage. Your lender collects it monthly with your payment.',
  },
  {
    term: 'PMI',
    plain: 'Private Mortgage Insurance — only if you put less than 20% down.',
    detail: 'PMI protects the lender (not you) if you default. It typically adds $50–200/month but disappears once you reach 20% equity. Down payment assistance programs can help you avoid it entirely.',
  },
];

export default function MortgageCalculatorPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-narrow text-center">
          <p className="section-label text-brand-400 mb-4">Free Tool</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
            What will your monthly<br />payment actually be?
          </h1>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed font-light">
            Most people guess. This calculator breaks it down to the dollar — principal, interest, taxes, insurance, and PMI — using today&apos;s live rates.
          </p>
        </div>
      </section>

      {/* Education — Interest vs Principal */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">Before you calculate</p>
            <h2 className="section-title">What&apos;s actually inside your mortgage payment?</h2>
            <p className="mt-4 text-gray-500 leading-relaxed font-light">
              A mortgage payment isn&apos;t one thing — it&apos;s four (sometimes five). Understanding each part
              helps you make smarter decisions about down payment, loan term, and timing.
            </p>

            {/* Visual breakdown */}
            <div className="mt-10 rounded-3xl bg-navy-50 border border-navy-100 p-8">
              <p className="text-sm font-semibold text-navy-700 mb-5">Example: $250,000 home · 10% down · 30-yr fixed at today&apos;s rates</p>
              <div className="space-y-3">
                {[
                  { label: 'Principal & Interest', pct: 72, color: 'bg-brand-600', desc: 'Loan repayment' },
                  { label: 'Property Tax', pct: 12, color: 'bg-blue-400', desc: '~0.7% annually' },
                  { label: 'Insurance', pct: 8, color: 'bg-emerald-400', desc: 'Homeowner\'s policy' },
                  { label: 'PMI', pct: 8, color: 'bg-amber-400', desc: 'Goes away at 20% equity' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-navy-800">{item.label}</span>
                      <span className="text-gray-500">{item.desc}</span>
                    </div>
                    <div className="h-2.5 bg-navy-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concepts */}
            <div className="mt-12 space-y-6">
              {CONCEPTS.map((c) => (
                <div key={c.term} className="border-l-2 border-brand-200 pl-5">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="font-serif font-bold text-navy-950 text-lg">{c.term}</h3>
                    <span className="text-sm text-brand-600 font-medium">{c.plain}</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.detail}</p>
                </div>
              ))}
            </div>

            {/* Amortization callout */}
            <div className="mt-10 rounded-2xl bg-brand-600 p-7 text-white">
              <h3 className="font-serif text-xl font-bold mb-2">The most important thing nobody tells first-time buyers</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                In year 1 of a 30-year mortgage, roughly <strong className="text-white">75–80% of your payment goes to interest</strong>, not your balance.
                By year 15, that flips. This is why buying sooner — even at a higher rate you can refinance later — often beats waiting.
                The equity you build in years 10–30 is where real wealth is created.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Your Numbers</p>
            <h2 className="section-title">Run your calculation</h2>
            <p className="section-subtitle max-w-md mx-auto">Pre-filled with today&apos;s live rate. Adjust any field.</p>
          </div>
          <MortgageCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Ready to make it real?</h2>
          <p className="mt-3 text-white/50 font-light max-w-md mx-auto">
            A pre-approval takes 24–48 hours and locks in your rate. Adreanne can connect you with trusted lenders who specialize in first-time buyers.
          </p>
          <div className="mt-7 flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="btn-primary text-sm">
              Get Pre-Approved <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all">
              Talk to Adreanne
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {['Down payment assistance up to $15,000', 'Healthcare worker grants', 'Credit repair path available'].map(item => (
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
