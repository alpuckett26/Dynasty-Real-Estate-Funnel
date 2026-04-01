import type { Metadata } from 'next';
import { CheckCircle, TrendingUp, Camera, BarChart2, Users, Clock } from 'lucide-react';
import { ValuationForm } from '@/components/forms/ValuationForm';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';

export const metadata: Metadata = {
  title: 'Sell Your Home | Get a Free Home Valuation',
  description:
    'Find out what your home is worth and get a strategic marketing plan to sell fast and for top dollar. Free, no-obligation home valuation.',
};

const SELLER_BENEFITS = [
  {
    icon: BarChart2,
    title: 'Data-Driven Pricing',
    desc: 'We analyze current market comps, trends, and buyer demand to price your home for maximum offers.',
  },
  {
    icon: Camera,
    title: 'Professional Marketing',
    desc: 'HDR photography, 3D tours, targeted social ads, and email campaigns to thousands of buyers.',
  },
  {
    icon: Users,
    title: 'Pre-Qualified Buyer Network',
    desc: 'Access our database of pre-qualified buyers actively searching in your area right now.',
  },
  {
    icon: Clock,
    title: 'Fast Results',
    desc: 'Our listings average 15 days on market — well below the local average of 45 days.',
  },
  {
    icon: TrendingUp,
    title: 'Above-Asking Offers',
    desc: '72% of our listings receive offers above the asking price. Our negotiators know how to drive competition.',
  },
  {
    icon: CheckCircle,
    title: 'Guided Every Step',
    desc: 'From staging to closing, your dedicated agent handles every detail so you can focus on your next chapter.',
  },
];

const PROCESS_STEPS = [
  { step: '01', title: 'Free Home Valuation', desc: 'We analyze your home, recent sales, and market trends to determine your optimal listing price.' },
  { step: '02', title: 'Listing Strategy', desc: 'Your agent creates a custom marketing plan including photos, ads, and a launch timeline.' },
  { step: '03', title: 'Market & Show', desc: 'We launch your listing with maximum exposure and coordinate all showings on your schedule.' },
  { step: '04', title: 'Offers & Negotiation', desc: 'We present all offers, advise on terms, and negotiate to get you the best possible outcome.' },
  { step: '05', title: 'Close & Celebrate', desc: 'We guide you through inspections, appraisals, and paperwork to a smooth closing day.' },
];

export default function SellPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">Sell with Dynasty</p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Get top dollar for your home
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Our data-driven approach and professional marketing consistently deliver above-asking offers and fast results. Start with a free, no-obligation home valuation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['No upfront fees', 'Free valuation report', 'Average 15 days on market'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-3 py-1.5 text-xs font-medium text-navy-200">
                  <CheckCircle className="h-3 w-3 text-brand-400" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="card shadow-2xl">
            <h2 className="font-serif text-2xl font-bold text-navy-900 mb-1">What&apos;s My Home Worth?</h2>
            <p className="text-sm text-gray-500 mb-6">Get your personalized valuation in 24 hours.</p>
            <ValuationForm />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Why sellers choose Dynasty</h2>
            <p className="section-subtitle">A complete selling system — not just a listing agent.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SELLER_BENEFITS.map((b) => (
              <div key={b.title} className="card hover:shadow-md transition-all">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-4">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">From valuation to closing — a clear, stress-free process.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-brand-200 mx-32" />
            <div className="grid md:grid-cols-5 gap-8 relative">
              {PROCESS_STEPS.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold text-xl mb-4 relative z-10">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-2 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Ready to sell?</h2>
          <p className="mt-3 text-brand-100">Get your free home valuation today — no commitment required.</p>
          <ScrollToTopButton className="mt-6 inline-block rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
            Get My Free Valuation
          </ScrollToTopButton>
        </div>
      </section>
    </>
  );
}
