import type { Metadata } from 'next';
import { CheckCircle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';

export const metadata: Metadata = {
  title: 'Sell Your Home Fast & For Top Dollar | Dynasty Real Estate',
  description:
    'Get a free home valuation and seller consultation. Dynasty\'s data-driven marketing consistently delivers above-asking offers and fast closings.',
};

const STATS = [
  { value: '15 Days', label: 'Average days on market' },
  { value: '72%', label: 'Listings get above-asking offers' },
  { value: '$1.2B+', label: 'In transactions closed' },
  { value: '98%', label: 'Client satisfaction rate' },
];

const WHAT_WE_DO = [
  {
    icon: DollarSign,
    title: 'Free Home Valuation',
    desc: 'We analyze recent sales, your home\'s condition, and current demand to give you an accurate, data-backed price range.',
  },
  {
    icon: TrendingUp,
    title: 'Strategic Pricing',
    desc: 'The right price drives competition. We position your home to attract multiple offers — not just one.',
  },
  {
    icon: Clock,
    title: 'Fast Results',
    desc: 'Our listings average 15 days on market vs. the local average of 45 days. We move fast without leaving money on the table.',
  },
];

export default function SellYourHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">
              Sell with Dynasty
            </p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Find out what your home is worth
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Get a free, no-obligation home valuation and a personalized selling strategy from a Dynasty listing specialist. Most sellers are surprised — in a good way.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                'Free valuation — no commitment required',
                'Prep tips to maximize your sale price',
                'Professional photography & marketing included',
                'No hidden fees or upfront costs',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-navy-200">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <IntakeForm
            source="sell-your-home"
            defaultIntent="seller"
            sellerMode
            heading="Get My Free Home Valuation"
            subheading="Takes 2 minutes. A specialist will follow up within 24 hours with your valuation report."
            ctaLabel="Request My Free Valuation"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-600 py-10">
        <div className="container-wide grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-serif font-bold text-white">{s.value}</p>
              <p className="text-sm text-brand-100 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">What sets Dynasty sellers apart</h2>
            <p className="section-subtitle">A complete selling system — not just a listing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((w) => (
              <div key={w.title} className="card hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-4">
                  <w.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{w.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Also buying? */}
      <section className="py-16 bg-gray-50">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-2xl font-bold text-navy-900">Also buying after you sell?</h2>
          <p className="mt-3 text-gray-600 max-w-md mx-auto">
            We specialize in coordinated buy-sell transactions. Ask your agent about bridge strategies and contingency planning — so you never get caught in between.
          </p>
          <a href="/register" className="btn-primary mt-6 inline-flex">
            Register as a Buyer + Seller
          </a>
        </div>
      </section>
    </>
  );
}
