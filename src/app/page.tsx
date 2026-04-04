import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Star, Home, TrendingUp, MapPin, CheckCircle, HeartPulse, Wrench, Phone } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';

export const metadata: Metadata = {
  title: 'Adreanne The Realtor | Baton Rouge Real Estate',
  description:
    'Baton Rouge\'s trusted real estate agent for first-time buyers, healthcare workers, and families. Free consultation. Real guidance. Real results.',
};

const STATS = [
  { value: 'Free', label: 'Consultation — no commitment' },
  { value: '< 5 min', label: 'Average response time' },
  { value: '$15k', label: 'Max down payment assistance' },
  { value: '100%', label: 'Dedicated to your goals' },
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
    text: 'As a nurse, I had no idea there were special programs for healthcare workers. Adreanne got me into my first home with grants I didn\'t know existed.',
    stars: 5,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-navy-950 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-950/40" />

        <div className="relative container-wide py-28 md:py-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-600/30 px-4 py-1.5 mb-6">
              <MapPin className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-brand-300 text-xs font-semibold tracking-wide">Baton Rouge, Louisiana</span>
            </div>

            <h1 className="font-serif text-5xl font-bold text-white md:text-6xl leading-[1.1]">
              Your keys are closer than you think.
            </h1>
            <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-lg">
              I&apos;m Adreanne — your Baton Rouge real estate agent. I specialize in helping first-time buyers,
              healthcare workers, and families get into homes they love, with programs most people don&apos;t know exist.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/buy" className="btn-primary text-sm px-7 py-3.5">
                I&apos;m Ready to Buy
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sell-your-home" className="btn-white text-sm px-7 py-3.5">
                What&apos;s My Home Worth?
              </Link>
            </div>

            <a
              href="tel:+12252846854"
              className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" />
              Or call me directly — (225) 284-6854
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="bg-brand-600">
        <div className="container-wide py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-serif font-bold text-white">{s.value}</p>
                <p className="text-xs text-brand-100 mt-0.5 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How can I help ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="section-title">How can I help you?</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              Whether you&apos;re buying, selling, or not quite ready — there&apos;s a path forward from here.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                href: '/buy',
                icon: Home,
                title: 'Buy a Home',
                desc: 'First-time buyer or upgrading — I\'ll find you the right home, negotiate hard, and guide you from search to keys.',
                cta: 'Start My Search',
                accent: 'bg-blue-50 text-blue-600',
              },
              {
                href: '/sell-your-home',
                icon: TrendingUp,
                title: 'Sell Your Home',
                desc: 'Free valuation, strategic pricing, and marketing that gets eyeballs on your listing. Most sellers are surprised by what they net.',
                cta: 'Get My Home Value',
                accent: 'bg-brand-50 text-brand-600',
              },
              {
                href: '/relocate',
                icon: MapPin,
                title: 'Relocate to BR',
                desc: 'Moving to Louisiana? I know every neighborhood, school district, and hidden gem in the area. Let\'s find your fit.',
                cta: 'Plan My Move',
                accent: 'bg-green-50 text-green-600',
              },
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${s.accent} mb-5`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-navy-950 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.desc}</p>
                <span className="text-sm font-semibold text-brand-600 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy-950">
        <div className="container-wide">
          <div className="text-center mb-14">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">
              You may qualify for more than you think
            </p>
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
              Special programs I work with
            </h2>
            <p className="mt-3 text-gray-400 max-w-lg mx-auto text-base">
              Most buyers don&apos;t know these programs exist. I&apos;ll show you exactly what you qualify for — for free.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                href: '/register',
                icon: Home,
                badge: 'Down Payment Assistance',
                badgeColor: 'bg-blue-500/20 text-blue-300',
                title: 'First-Time Homebuyer',
                desc: 'Grants and assistance programs that can cover up to $15,000 toward your down payment and closing costs. Many buyers qualify without knowing it.',
                cta: 'Check My Eligibility',
              },
              {
                href: '/register',
                icon: HeartPulse,
                badge: 'Healthcare Grants',
                badgeColor: 'bg-green-500/20 text-green-300',
                title: 'Healthcare Worker Perks',
                desc: 'Nurses, doctors, EMTs, and healthcare professionals qualify for exclusive grants and reduced fees. You earned it — let\'s use it.',
                cta: 'See What I Qualify For',
              },
              {
                href: '/get-ready',
                icon: Wrench,
                badge: 'Credit Repair Path',
                badgeColor: 'bg-brand-500/20 text-brand-300',
                title: 'Not Quite Ready Yet?',
                desc: 'Credit needs work? No down payment saved? I have a structured 6–12 month path that gets you from where you are to the keys in your hand.',
                cta: 'Start My Path',
              },
            ].map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group rounded-2xl bg-navy-900 p-6 ring-1 ring-navy-700 hover:ring-brand-600/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className={`badge ${p.badgeColor} mb-4`}>{p.badge}</span>
                <h3 className="text-lg font-serif font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{p.desc}</p>
                <span className="text-sm font-semibold text-brand-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-14">
            <h2 className="section-title">What my clients say</h2>
            <p className="section-subtitle">Real people. Real results. Right here in Louisiana.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card flex flex-col">
                <div className="flex mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-500 text-brand-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead capture ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy-950">
        <div className="container-wide grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-4">Let&apos;s talk</p>
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl leading-tight">
              Ready to take the first step?
            </h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Free consultation, no pressure, no obligation. I&apos;ll give you an honest picture
              of what&apos;s possible for you — and a clear path to get there.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                'Free consultation — I\'ll call you within 5 minutes',
                'Find out which programs you qualify for',
                'Get an honest market read for your situation',
                'No pushy sales — just straight answers',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
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
