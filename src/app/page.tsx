import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Star, Home, TrendingUp, MapPin, CheckCircle, HeartPulse, Wrench, Phone, Quote } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';

export const metadata: Metadata = {
  title: 'Adreanne The Realtor | Baton Rouge Real Estate',
  description:
    'Baton Rouge\'s trusted real estate agent for first-time buyers, healthcare workers, and families. Free consultation. Real guidance. Real results.',
};

const STATS = [
  { value: '$15k', label: 'Max Down Payment Assistance' },
  { value: '5 min', label: 'Average Response Time' },
  { value: '100%', label: 'Free Buyer Representation' },
  { value: 'Zero', label: 'Pressure. Ever.' },
];

const TESTIMONIALS = [
  {
    name: 'Tiffany R.',
    location: 'Zachary, LA',
    text: 'Adreanne walked me through every single step as a first-time buyer. I had no idea I qualified for down payment assistance — she found me $12,000. Life-changing.',
    stars: 5,
  },
  {
    name: 'Marcus & Keisha J.',
    location: 'Baton Rouge, LA',
    text: 'We were relocating from Houston and had 30 days to find a home. Adreanne found us the perfect place in Prairieville and handled everything remotely. Seamless.',
    stars: 5,
  },
  {
    name: 'Dr. Amanda T.',
    location: 'Mid City, BR',
    text: 'As a nurse, I had no idea there were special programs for healthcare workers. Adreanne got me into my first home with grants I didn\'t even know existed.',
    stars: 5,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden -mt-[72px]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=90')" }}
        />
        {/* Layered gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />

        <div className="relative container-wide pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="max-w-2xl">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="h-px w-8 bg-brand-400" />
              <span className="text-brand-300 text-xs font-semibold tracking-[0.2em] uppercase">
                Baton Rouge, Louisiana
              </span>
            </div>

            <h1 className="font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Your keys are<br />
              <span className="text-blue-300">closer than</span><br />
              you think.
            </h1>

            <p className="mt-7 text-lg text-white/70 leading-relaxed max-w-xl font-light">
              I&apos;m Adreanne — your Baton Rouge real estate agent. I help first-time buyers,
              healthcare workers, and families get into homes they love, using programs most agents don&apos;t even know exist.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/buy" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-xl hover:-translate-y-px">
                I&apos;m Ready to Buy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sell-your-home" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm px-8 py-4 text-sm font-semibold tracking-wide text-white transition-all hover:bg-white/20">
                What&apos;s My Home Worth?
              </Link>
            </div>

            <a
              href="tel:+12252846854"
              className="mt-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Or call directly — (225) 284-6854
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
          <span className="text-white text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/40" />
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-wide py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {STATS.map((s) => (
              <div key={s.label} className="text-center py-4 md:py-0 first:pt-0 last:pb-0">
                <p className="text-3xl font-serif font-bold text-navy-950">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1.5 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How can I help ───────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="container-wide">
          <div className="max-w-xl mb-16">
            <p className="section-label">What I do</p>
            <h2 className="section-title">How can I help you?</h2>
            <p className="section-subtitle">
              Whether you&apos;re buying, selling, or not quite ready — there&apos;s a clear path forward from here.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                href: '/buy',
                icon: Home,
                title: 'Buy a Home',
                desc: 'First-time buyer or upgrading — I\'ll find you the right home, negotiate hard, and guide you from search to keys. Buyer representation is 100% free.',
                cta: 'Start My Search',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                href: '/sell-your-home',
                icon: TrendingUp,
                title: 'Sell Your Home',
                desc: 'Free valuation, strategic pricing, and marketing that gets eyeballs on your listing. Most sellers are surprised by what they net.',
                cta: 'Get My Home Value',
                color: 'text-brand-600 bg-brand-50',
              },
              {
                href: '/relocate',
                icon: MapPin,
                title: 'Relocate to BR',
                desc: 'Moving to Louisiana? I know every neighborhood, school district, and hidden gem in the area. Let\'s find your fit — remotely or in person.',
                cta: 'Plan My Move',
                color: 'text-emerald-600 bg-emerald-50',
              },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group card hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.color} mb-6`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-navy-950 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{s.desc}</p>
                <span className="text-sm font-semibold text-brand-600 flex items-center gap-1.5 group-hover:gap-3 transition-all duration-200">
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Agent intro ───────────────────────────────────────────────── */}
      <section className="py-28 bg-navy-50">
        <div className="container-wide grid md:grid-cols-2 gap-16 items-center">
          {/* Image block */}
          <div className="relative">
            <div
              className="aspect-[4/5] rounded-3xl bg-cover bg-center bg-top overflow-hidden shadow-2xl"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80')" }}
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white rounded-2xl shadow-xl px-6 py-5 border border-gray-100">
              <p className="text-3xl font-serif font-bold text-navy-950">$15k</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[120px] leading-snug">Max down payment assistance available</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="section-label">Meet Adreanne</p>
            <h2 className="section-title">Your neighbor, your advocate, your agent.</h2>
            <p className="mt-5 text-gray-500 leading-relaxed">
              I&apos;m not just a Baton Rouge real estate agent — I&apos;m someone who grew up here, knows these streets,
              and genuinely cares about getting families into homes they love.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              I specialize in first-time homebuyers, healthcare workers, and people who think homeownership
              is out of reach. My job is to show you it&apos;s not.
            </p>

            <ul className="mt-8 space-y-3.5">
              {[
                'Down payment assistance up to $15,000',
                'Exclusive grants for healthcare workers',
                'Free buyer representation — no cost to you',
                'Credit repair path for buyers who aren\'t quite ready',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary text-sm">
                Work With Adreanne
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="tel:+12252846854" className="btn-outline-dark text-sm">
                Call (225) 284-6854
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Programs ─────────────────────────────────────────────────────────── */}
      <section className="py-28 bg-navy-950">
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              You may qualify for more than you think
            </p>
            <h2 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
              Programs most agents<br />don&apos;t know about
            </h2>
            <p className="mt-4 text-white/50 max-w-md mx-auto text-base font-light">
              I&apos;ll show you exactly what you qualify for — completely free, no obligation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                href: '/register',
                icon: Home,
                badge: 'Down Payment Assistance',
                badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
                title: 'First-Time Homebuyer',
                desc: 'Grants and assistance programs that can cover up to $15,000 toward your down payment and closing costs. Many buyers qualify without knowing it.',
                cta: 'Check My Eligibility',
              },
              {
                href: '/register',
                icon: HeartPulse,
                badge: 'Healthcare Grants',
                badgeColor: 'bg-green-500/15 text-green-300 border border-green-500/20',
                title: 'Healthcare Worker Perks',
                desc: 'Nurses, doctors, EMTs, and healthcare professionals qualify for exclusive grants and reduced fees. You\'ve earned it.',
                cta: 'See What I Qualify For',
              },
              {
                href: '/get-ready',
                icon: Wrench,
                badge: 'Credit Repair Path',
                badgeColor: 'bg-brand-500/15 text-brand-300 border border-brand-500/20',
                title: 'Not Quite Ready Yet?',
                desc: 'Credit needs work? No down payment saved? I have a structured 6–12 month path that gets you from where you are to the keys in your hand.',
                cta: 'Start My Path',
              },
            ].map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group rounded-2xl bg-white/5 border border-white/8 p-8 hover:bg-white/10 hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                <span className={`badge ${p.badgeColor} mb-5 text-[11px]`}>{p.badge}</span>
                <h3 className="text-xl font-serif font-bold text-white mb-3">{p.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">{p.desc}</p>
                <span className="text-sm font-semibold text-brand-400 flex items-center gap-1.5 group-hover:gap-3 transition-all duration-200">
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="section-label">Client Stories</p>
            <h2 className="section-title">Real people. Real results.</h2>
            <p className="section-subtitle">Right here in Louisiana.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <Quote className="h-8 w-8 text-brand-200 mb-4 flex-shrink-0" />
                <p className="text-gray-700 text-base leading-relaxed flex-1 font-light">{t.text}</p>
                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.location}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead capture ─────────────────────────────────────────────────────── */}
      <section className="py-28 bg-navy-950">
        <div className="container-wide grid md:grid-cols-2 gap-16 items-start">
          <div className="md:pt-4">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-[0.2em] mb-5">Free Consultation</p>
            <h2 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight tracking-tight">
              Ready to take<br />the first step?
            </h2>
            <p className="mt-5 text-white/60 leading-relaxed font-light">
              Free consultation, no pressure, no obligation. I&apos;ll give you an honest picture
              of what&apos;s possible — and a clear path to get there.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'I\'ll call you within 5 minutes during business hours',
                'Find out which programs you qualify for',
                'Get an honest read on your market situation',
                'No pushy sales — just straight answers',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="mt-10 pt-10 border-t border-white/10">
              <p className="text-xs text-white/30 tracking-wide">Adreanne The Realtor · Baton Rouge, LA · (225) 284-6854</p>
            </div>
          </div>

          <LeadForm
            source="homepage"
            heading="Talk to Adreanne"
            subheading="Fill this out and I'll reach out within 5 minutes."
            showTimeline
            ctaLabel="Get My Free Consultation"
          />
        </div>
      </section>
    </>
  );
}
