import type { Metadata } from 'next';
import { RentVsBuyCalculator } from '@/components/calculators/RentVsBuyCalculator';
import { ArrowRight, TrendingUp, Home, DollarSign } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rent vs. Buy Calculator | Is Buying Right for You?',
  description: 'Find out whether buying a home makes more financial sense than renting — with real numbers personalized to your situation.',
};

const MYTHS = [
  {
    myth: 'Renting is throwing money away.',
    reality: 'Partly true — but buying also has costs that don\'t build equity (interest, insurance, taxes, repairs). The real question is which option builds more wealth over your specific timeline.',
  },
  {
    myth: 'You need to stay 30 years to make buying worth it.',
    reality: 'In most Louisiana markets, the break-even point is 3–5 years. After that, you\'re building equity every single month while your neighbor\'s rent goes up.',
  },
  {
    myth: 'Renting gives you flexibility.',
    reality: 'True — but that flexibility has a price. The average renter loses $500–800/month in wealth they could be building. Over 10 years, that\'s $60,000–96,000 in net worth you don\'t have.',
  },
  {
    myth: 'It\'s cheaper to rent right now.',
    reality: 'Sometimes true short-term. But your rent will increase — your mortgage won\'t. A fixed-rate mortgage is the only housing cost that stays the same for 30 years.',
  },
];

const WEALTH_DRIVERS = [
  {
    icon: TrendingUp,
    title: 'Appreciation',
    desc: 'Homes in the Baton Rouge area have appreciated an average of 3–5% annually over the past decade. On a $250,000 home, that\'s $7,500–12,500 in added value every year — without doing anything.',
  },
  {
    icon: DollarSign,
    title: 'Equity from payments',
    desc: 'Every mortgage payment chips away at your balance. After 5 years on a $225,000 loan, you\'ve paid down roughly $15,000–20,000 in principal — money that\'s yours.',
  },
  {
    icon: Home,
    title: 'Forced savings',
    desc: 'A mortgage is one of the few financial products that forces you to save. Most renters don\'t invest the difference — they just spend it. Homeownership makes building wealth automatic.',
  },
];

export default function RentVsBuyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-narrow text-center">
          <p className="section-label text-brand-400 mb-4">Free Tool</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
            Should you rent or buy?
          </h1>
          <p className="mt-4 text-white/60 max-w-lg mx-auto leading-relaxed font-light">
            It&apos;s the most important financial decision most people make. Let&apos;s look at your real numbers — not generic advice.
          </p>
        </div>
      </section>

      {/* The honest answer */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-3">The honest answer</p>
            <h2 className="section-title">It depends — but probably sooner than you think.</h2>
            <p className="mt-5 text-gray-500 leading-relaxed font-light">
              I won&apos;t tell you buying is always better. For someone moving in 12 months, renting makes sense.
              But for most people in Baton Rouge who plan to stay 3+ years? The math almost always favors buying —
              and the gap widens every year you wait.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed font-light">
              Here&apos;s what most people miss: <strong className="text-navy-950 font-semibold">your rent will go up</strong>. Your mortgage won&apos;t.
              In 10 years, you&apos;re either sitting in a home you own — worth more than you paid —
              or you&apos;ve handed your landlord $120,000+ with nothing to show for it.
            </p>

            {/* Myth busting */}
            <div className="mt-12 space-y-5">
              <h3 className="font-serif text-2xl font-bold text-navy-950">Let&apos;s clear up the myths</h3>
              {MYTHS.map((m) => (
                <div key={m.myth} className="rounded-2xl border border-gray-100 p-6">
                  <p className="text-sm font-semibold text-gray-400 italic mb-2">&ldquo;{m.myth}&rdquo;</p>
                  <p className="text-sm text-navy-800 leading-relaxed">
                    <span className="text-brand-600 font-semibold">Reality: </span>{m.reality}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How buying builds wealth */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">The wealth gap</p>
            <h2 className="section-title">How buying builds wealth renters never see</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {WEALTH_DRIVERS.map((w) => (
              <div key={w.title} className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-5">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif font-bold text-navy-950 text-lg mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>

          {/* The number that matters */}
          <div className="mt-12 max-w-3xl mx-auto rounded-3xl bg-brand-600 p-8 text-white">
            <h3 className="font-serif text-2xl font-bold mb-3">The number that should make renters pause</h3>
            <p className="text-white/80 leading-relaxed">
              The average homeowner in the U.S. has a net worth of <strong className="text-white">$396,200</strong>.
              The average renter has a net worth of <strong className="text-white">$10,400</strong>.
              That&apos;s a <strong className="text-white">38x difference</strong> — and homeownership is the single biggest reason.
              Owning a home is still the most reliable path to building middle-class wealth in America.
            </p>
            <p className="text-white/60 text-xs mt-3">Source: Federal Reserve Survey of Consumer Finances</p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Your Numbers</p>
            <h2 className="section-title">Run your rent vs. buy comparison</h2>
            <p className="section-subtitle max-w-md mx-auto">Adjust the numbers to match your situation.</p>
          </div>
          <RentVsBuyCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">See what you could qualify for today</h2>
          <p className="mt-3 text-white/50 font-light max-w-md mx-auto">
            Down payment assistance, first-time buyer programs, and lender connections — all free through Adreanne.
          </p>
          <div className="mt-7 flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="btn-primary text-sm">
              Check My Eligibility <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/book" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all">
              Talk to Adreanne
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
