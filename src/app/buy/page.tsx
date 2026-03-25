import type { Metadata } from 'next';
import { CheckCircle, Search, Shield, HeartHandshake, Key, Calendar } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';

export const metadata: Metadata = {
  title: 'Buy a Home | Expert Buyer Representation',
  description:
    'Find your perfect home with Dynasty Real Estate. Expert buyer agents, exclusive listings, and a proven process that gets you into your dream home.',
};

const BUYER_BENEFITS = [
  {
    icon: Search,
    title: 'Exclusive Listing Access',
    desc: 'See homes before they hit the market. Our network gives you first access to off-market and coming-soon listings.',
  },
  {
    icon: Shield,
    title: 'Expert Negotiation',
    desc: 'We\'ve negotiated hundreds of offers. Our agents know how to win in competitive markets without overpaying.',
  },
  {
    icon: HeartHandshake,
    title: 'Buyer Representation at No Cost',
    desc: 'Our buyer representation is completely free to you. The seller pays our commission.',
  },
  {
    icon: Key,
    title: 'Smooth Closing',
    desc: 'From offer to keys, we coordinate every step — inspections, appraisals, lenders, and title companies.',
  },
];

const BUYER_STEPS = [
  { step: '01', title: 'Free Consultation', desc: 'We learn your goals, budget, and timeline to create a custom search strategy.' },
  { step: '02', title: 'Smart Property Search', desc: 'Curated home matches delivered to your inbox. No more endless scrolling.' },
  { step: '03', title: 'Showings & Selection', desc: 'Tour homes on your schedule. We share honest pros and cons for every property.' },
  { step: '04', title: 'Winning Offer', desc: 'We structure a compelling offer strategy based on market conditions.' },
  { step: '05', title: 'Move In', desc: 'Keys in hand. We stay available even after closing for any questions.' },
];

export default function BuyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">Buy with Dynasty</p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Find your perfect home — faster
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Expert buyer agents, exclusive listings, and a proven process. We handle the hard parts so you can focus on the exciting ones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['No cost to buyers', 'Off-market access', 'Expert negotiation'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-3 py-1.5 text-xs font-medium text-navy-200">
                  <CheckCircle className="h-3 w-3 text-brand-400" /> {item}
                </span>
              ))}
            </div>
          </div>

          <LeadForm
            source="buy-page"
            intent="buyer"
            heading="Start Your Home Search"
            subheading="Tell us what you're looking for and we'll connect you with an expert buyer agent."
            showTimeline
            showFinancing
            showMessage
            ctaLabel="Connect Me with a Buyer Agent"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Why buyers love Dynasty</h2>
            <p className="section-subtitle">We put buyers first — always.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {BUYER_BENEFITS.map((b) => (
              <div key={b.title} className="card text-center hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4">
                  <b.icon className="h-6 w-6" />
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
            <h2 className="section-title">Your buying journey</h2>
            <p className="section-subtitle">A clear process from search to move-in day.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {BUYER_STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-5 card">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Ready to find your dream home?</h2>
          <p className="mt-3 text-brand-100">Book a free buyer consultation — no commitment required.</p>
          <a href="/book" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
            <Calendar className="h-4 w-4" />
            Book My Free Consultation
          </a>
        </div>
      </section>
    </>
  );
}
