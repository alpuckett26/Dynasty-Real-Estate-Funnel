import type { Metadata } from 'next';
import { CheckCircle, Clock, Phone, Star, ArrowDown } from 'lucide-react';
import { CalendlyEmbed, CalendlyFallback } from '@/components/ui/CalendlyEmbed';

export const metadata: Metadata = {
  title: 'Book a Free Consultation | Adreanne The Realtor',
  description:
    'Schedule a free, no-obligation consultation with Adreanne. Available by phone, video, or in-person in Baton Rouge.',
};

const WHAT_TO_EXPECT = [
  'A real conversation — not a sales pitch',
  'Find out which programs you qualify for',
  'Honest market analysis for your situation',
  'A clear next step, no pressure',
  'Answers to every question you have',
];

const TESTIMONIALS = [
  {
    name: 'Tiffany R.',
    location: 'Zachary, LA',
    text: 'She called within 5 minutes. Knew exactly what I needed and found me $12,000 in down payment assistance.',
    stars: 5,
  },
  {
    name: 'Marcus J.',
    location: 'Baton Rouge, LA',
    text: 'Most helpful 20-minute call I\'ve ever had. She didn\'t try to sell me anything — just gave me the real picture.',
    stars: 5,
  },
  {
    name: 'Dr. Amanda T.',
    location: 'Mid City, BR',
    text: 'I didn\'t even know there were grants for healthcare workers. One call changed everything.',
    stars: 5,
  },
];

export default function BookPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden -mt-[72px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=90')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/80 to-navy-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />

        <div className="relative container-wide pt-24">
          <div className="max-w-xl">
            <p className="text-brand-300 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Free · No Obligation · 20 Minutes
            </p>
            <h1 className="font-serif text-5xl font-bold text-white md:text-6xl leading-[1.05] tracking-tight">
              Let&apos;s talk about<br />
              <span className="text-brand-300">your future home.</span>
            </h1>
            <p className="mt-6 text-lg text-white/65 leading-relaxed font-light max-w-md">
              One conversation with Adreanne can change everything. Find out exactly what you qualify for — programs, grants, and a clear path forward.
            </p>

            <div className="mt-10 flex flex-wrap gap-6 items-center">
              <a
                href="#schedule"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition-all hover:bg-brand-700 hover:shadow-xl hover:-translate-y-px"
              >
                Book My Free Call
                <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="tel:+12252846854"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                (225) 284-6854
              </a>
            </div>
          </div>
        </div>

        {/* Scroll nudge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-white text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/50" />
        </div>
      </section>

      {/* ── What to expect ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container-wide grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label">What happens on the call</p>
            <h2 className="section-title">Real talk. No scripts.</h2>
            <p className="mt-5 text-gray-500 leading-relaxed font-light">
              I don&apos;t run you through a sales funnel. I listen to where you are, tell you what&apos;s realistic,
              and show you the clearest path to the keys.
            </p>
            <ul className="mt-8 space-y-4">
              {WHAT_TO_EXPECT.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-3 text-sm text-gray-400">
              <Clock className="h-4 w-4 text-brand-400" />
              20–30 minutes · Available Mon–Sun, 7am–9pm
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div
              className="aspect-[4/3] rounded-3xl bg-cover bg-center shadow-2xl overflow-hidden"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80')" }}
            />
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-6 py-5 border border-gray-100 max-w-[200px]">
              <p className="text-3xl font-serif font-bold text-navy-950">5 min</p>
              <p className="text-xs text-gray-500 mt-1 leading-snug">Average response time during business hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-14">
            <p className="section-label">Client Stories</p>
            <h2 className="section-title">One call changed everything.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-base font-light leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calendar ─────────────────────────────────────────────────────────── */}
      <section id="schedule" className="py-24 bg-white scroll-mt-[72px]">
        <div className="container-wide">
          <div className="text-center mb-14">
            <p className="section-label">Book Your Call</p>
            <h2 className="section-title">Pick a time that works for you.</h2>
            <p className="section-subtitle max-w-md mx-auto">
              All times in Central Time · Baton Rouge, LA
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {calendlyUrl ? (
              <CalendlyEmbed url={calendlyUrl} />
            ) : (
              <div className="p-10">
                <CalendlyFallback />
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto leading-relaxed">
            By booking, you agree to be contacted by Adreanne Aranha regarding your real estate needs.
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-navy-950">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Prefer to call?</h2>
          <p className="mt-3 text-white/50 font-light">I&apos;m available Monday through Sunday, 7am–9pm Central.</p>
          <a
            href="tel:+12252846854"
            className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/20 px-8 py-4 text-white font-semibold hover:bg-white/20 transition-all"
          >
            <Phone className="h-4 w-4 text-brand-400" />
            (225) 284-6854
          </a>
        </div>
      </section>
    </>
  );
}
