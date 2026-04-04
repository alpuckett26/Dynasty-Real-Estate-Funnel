import type { Metadata } from 'next';
import { CheckCircle, Search, Shield, HeartHandshake, Key, Calendar } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';
import { RatesWidget } from '@/components/ui/RatesWidget';

export const metadata: Metadata = {
  title: 'Buy a Home in Baton Rouge | Expert Buyer Representation',
  description:
    'Find your perfect home in Baton Rouge with Adreanne The Realtor. First-time buyer programs, expert negotiation, and zero cost to buyers.',
};

const BUYER_BENEFITS = [
  {
    icon: Search,
    title: 'Off-Market Access',
    desc: 'See homes before they hit Zillow. My network gives you first access to coming-soon and off-market listings.',
  },
  {
    icon: Shield,
    title: 'Expert Negotiation',
    desc: 'I know the Baton Rouge market inside out. I structure offers that win without overpaying.',
  },
  {
    icon: HeartHandshake,
    title: 'Free to Buyers',
    desc: 'My buyer representation costs you nothing. The seller pays my commission — you get a full-service agent at no cost.',
  },
  {
    icon: Key,
    title: 'Smooth Closing',
    desc: 'From offer to keys, I coordinate every step — inspections, appraisals, lenders, and title. You just show up.',
  },
];

const BUYER_STEPS = [
  { step: '01', title: 'Free Consultation', desc: 'We talk through your goals, budget, and timeline. I\'ll tell you honestly what\'s possible and which programs you qualify for.' },
  { step: '02', title: 'Smart Property Search', desc: 'Curated matches based on what you actually want — not just what the algorithm thinks. No endless scrolling.' },
  { step: '03', title: 'Showings & Honest Feedback', desc: 'Tour homes on your schedule. I give you the real pros and cons for every property, not just the positives.' },
  { step: '04', title: 'Winning Offer Strategy', desc: 'I structure offers based on real market conditions — competitive enough to win, smart enough to protect you.' },
  { step: '05', title: 'Keys in Hand', desc: 'Smooth closing, coordinated from start to finish. I stay available even after you move in.' },
];

export default function BuyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-start">
          <div className="pt-4">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">Buy with Adreanne</p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Find your home in Baton Rouge — faster
            </h1>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Expert buyer representation, local market knowledge, and programs most buyers don&apos;t know exist.
              I handle the hard parts so you can focus on the exciting ones.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Free to buyers', 'Off-market access', 'First-time buyer programs', 'Expert negotiation'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-200">
                  <CheckCircle className="h-3 w-3 text-brand-400" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <RatesWidget variant="card" showCTA={false} />
            <LeadForm
              source="buy-page"
              intent="buyer"
              heading="Start Your Home Search"
              subheading="Tell me what you're looking for — I'll respond within 5 minutes."
              showTimeline
              showFinancing
              showMessage
              ctaLabel="Connect Me with Adreanne"
              className="shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Why buyers work with me</h2>
            <p className="section-subtitle">I put your interests first — always.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {BUYER_BENEFITS.map((b) => (
              <div key={b.title} className="card text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-950 mb-2 text-sm">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Your buying journey</h2>
            <p className="section-subtitle">A clear process from first call to move-in day.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {BUYER_STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-5 card">
                <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-950">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Ready to find your home?</h2>
          <p className="mt-3 text-brand-100 text-sm">Free buyer consultation — no commitment, no pressure.</p>
          <a href="/book" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors shadow-sm">
            <Calendar className="h-4 w-4" />
            Book My Free Consultation
          </a>
        </div>
      </section>
    </>
  );
}
