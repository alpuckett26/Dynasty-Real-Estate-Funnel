import type { Metadata } from 'next';
import { CheckCircle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';

export const metadata: Metadata = {
  title: 'Sell Your Home | Free Valuation — Adreanne The Realtor',
  description:
    'Find out what your Baton Rouge home is worth. Free, no-obligation valuation from Adreanne The Realtor. Most sellers are surprised — in a good way.',
};

const WHAT_WE_DO = [
  {
    icon: DollarSign,
    title: 'Free Home Valuation',
    desc: 'I analyze recent sales, your home\'s condition, and current demand to give you an honest, data-backed price range. No fluff.',
  },
  {
    icon: TrendingUp,
    title: 'Strategic Pricing',
    desc: 'The right price drives competition. I position your home to attract multiple offers — not just one lowball.',
  },
  {
    icon: Clock,
    title: 'Faster Results',
    desc: 'Strong marketing, professional photos, and real buyer networks. I move fast without leaving money on the table.',
  },
];

export default function SellYourHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-start">
          <div className="pt-4">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Sell with Adreanne
            </p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Find out what your home is worth
            </h1>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Get a free, honest home valuation and a personalized selling strategy.
              No pressure. No obligation. Most sellers are surprised by what they net.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                'Free valuation — takes 2 minutes to request',
                'Prep tips to maximize your final sale price',
                'Professional photography & marketing included',
                'No upfront costs or hidden fees',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
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
            subheading="Takes 2 minutes. I'll follow up within 24 hours with your valuation report."
            ctaLabel="Request My Free Valuation"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* What I do */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">What sets my sellers apart</h2>
            <p className="section-subtitle">A complete selling strategy — not just a listing.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {WHAT_WE_DO.map((w) => (
              <div key={w.title} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-950 mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Also buying? */}
      <section className="py-16 bg-navy-50">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-2xl font-bold text-navy-950">Also buying after you sell?</h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
            I specialize in coordinated buy-sell transactions. Let&apos;s talk about bridge strategies and timing
            so you&apos;re never caught in between.
          </p>
          <a href="/register" className="btn-primary mt-6 inline-flex">
            Register as a Buyer + Seller
          </a>
        </div>
      </section>
    </>
  );
}
