import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Star, Home, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';

export const metadata: Metadata = {
  title: 'Dynasty Real Estate | Buy, Sell & Relocate with Confidence',
  description:
    'Expert real estate guidance for buyers, sellers, and relocating families. Local market knowledge. AI-powered matching. Human expertise.',
};

const STATS = [
  { value: '500+', label: 'Homes Sold' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '$1.2B+', label: 'In Transactions' },
  { value: '15 Days', label: 'Avg. Days on Market' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah & Mike T.',
    text: 'Dynasty found us our dream home in 3 weeks — and sold our old one above asking. Incredible team.',
    stars: 5,
  },
  {
    name: 'James L.',
    text: 'Relocated from New York and was overwhelmed. The Dynasty team made the whole process seamless.',
    stars: 5,
  },
  {
    name: 'The Chen Family',
    text: 'Sold our home in 8 days with multiple offers. Could not be happier with the results.',
    stars: 5,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy-950 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')" }}
        />
        <div className="relative container-wide py-24 md:py-36">
          <div className="max-w-2xl">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">
              Dynasty Real Estate
            </p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-6xl leading-tight">
              Your next chapter starts here
            </h1>
            <p className="mt-5 text-lg text-navy-300 leading-relaxed">
              Whether you&apos;re buying your first home, selling for top dollar, or relocating — Dynasty&apos;s expert agents and AI-powered tools give you an unfair advantage.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/buy" className="btn-primary text-base px-8 py-4">
                I&apos;m Buying
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sell" className="btn-secondary bg-transparent text-white border-white hover:bg-white/10 text-base px-8 py-4">
                I&apos;m Selling
              </Link>
              <Link href="/relocate" className="btn-ghost text-white hover:bg-white/10 text-base px-8 py-4">
                I&apos;m Relocating
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Services split */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How can we help you?</h2>
            <p className="section-subtitle">Tailored guidance for every real estate journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                href: '/buy',
                icon: Home,
                title: 'Buy a Home',
                desc: 'Access exclusive listings, AI-powered matching, and expert negotiation to find your perfect home.',
                cta: 'Start My Search',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                href: '/sell',
                icon: TrendingUp,
                title: 'Sell Your Home',
                desc: 'Get a free valuation, strategic pricing, and a marketing plan that attracts serious buyers.',
                cta: 'Get My Home Value',
                color: 'text-brand-600 bg-brand-50',
              },
              {
                href: '/relocate',
                icon: MapPin,
                title: 'Relocate',
                desc: 'Moving to a new city? Our relocation specialists handle everything from neighborhood guides to school research.',
                cta: 'Plan My Move',
                color: 'text-green-600 bg-green-50',
              },
            ].map((s) => (
              <Link key={s.href} href={s.href} className="card group hover:shadow-md transition-all">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.color} mb-4`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{s.desc}</p>
                <span className="text-sm font-semibold text-brand-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20">
        <div className="container-wide">
          <h2 className="section-title text-center mb-12">What our clients say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-500 text-brand-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs font-semibold text-gray-500">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead capture */}
      <section className="py-20 bg-navy-950">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
              Ready to take the first step?
            </h2>
            <p className="mt-4 text-navy-300 leading-relaxed">
              Connect with a Dynasty agent today. No pressure, no obligation — just expert advice tailored to your goals.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Free consultation — no commitment',
                'Local market expertise',
                'Dedicated agent from day one',
                'Average response time under 5 minutes',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-navy-200">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <LeadForm
            source="homepage"
            heading="Talk to an Agent"
            subheading="Fill out the form and we'll reach out within 5 minutes."
            showTimeline
            ctaLabel="Connect Me With an Agent"
          />
        </div>
      </section>
    </>
  );
}
