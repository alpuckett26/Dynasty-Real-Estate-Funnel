import type { Metadata } from 'next';
import { CheckCircle, Clock, Phone, Video, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book a Free Consultation | Dynasty Real Estate',
  description:
    'Schedule a free, no-obligation consultation with a Dynasty Real Estate expert. Available in-person, virtual, or by phone.',
};

const CONSULTATION_OPTIONS = [
  {
    icon: Video,
    title: 'Video Call',
    desc: 'Join from anywhere. Perfect for relocation clients or busy schedules.',
    available: 'Mon–Sat, 8am–7pm',
  },
  {
    icon: Phone,
    title: 'Phone Call',
    desc: 'Quick and easy. Get expert advice in as little as 15 minutes.',
    available: 'Mon–Sun, 7am–9pm',
  },
  {
    icon: MapPin,
    title: 'In-Person',
    desc: 'Meet at our office or at a property. Preferred for serious buyers and sellers.',
    available: 'Mon–Sat, 9am–6pm',
  },
];

const WHAT_TO_EXPECT = [
  'A real agent — not a call center',
  'Deep dive into your goals and timeline',
  'Honest market analysis for your situation',
  'A clear recommended next step (no pressure)',
  'Answers to all your questions',
];

export default function BookPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-narrow text-center">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">Free Consultation</p>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            Let&apos;s talk about your goals
          </h1>
          <p className="mt-4 text-lg text-navy-300 max-w-xl mx-auto leading-relaxed">
            Book a free, no-obligation consultation with one of our experts. We&apos;ll listen first, then give you honest advice.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-navy-300">
            <Clock className="h-4 w-4 text-brand-400" />
            Typical consultation: 20–30 minutes
          </div>
        </div>
      </section>

      {/* Consultation options */}
      <section className="py-16 bg-gray-50">
        <div className="container-wide">
          <h2 className="section-title text-center mb-10">Choose how you want to meet</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CONSULTATION_OPTIONS.map((o) => (
              <div key={o.title} className="card text-center hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-4">
                  <o.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{o.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{o.desc}</p>
                <p className="text-xs text-gray-400">Available: {o.available}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scheduler */}
      <section className="py-16">
        <div className="container-narrow">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* What to expect */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">What to expect</h2>
              <ul className="space-y-3">
                {WHAT_TO_EXPECT.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 card bg-brand-50 border border-brand-200">
                <p className="text-sm font-semibold text-brand-800 mb-1">Prefer to call us directly?</p>
                <a href="tel:+15553962789" className="text-lg font-bold text-brand-700 hover:text-brand-800">
                  (555) DYN-ASTY
                </a>
                <p className="text-xs text-brand-600 mt-1">Mon–Sun, 7am–9pm</p>
              </div>
            </div>

            {/* Calendly embed */}
            <div className="card shadow-lg">
              <h3 className="font-serif text-xl font-bold text-navy-900 mb-4">Pick a time that works for you</h3>
              {calendlyUrl ? (
                <div
                  className="calendly-inline-widget min-h-[500px] -mx-6 -mb-6 rounded-b-2xl overflow-hidden"
                  data-url={`${calendlyUrl}?hide_gdpr_banner=1&primary_color=b96614`}
                  style={{ minWidth: '320px', height: '630px' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Scheduling is powered by Calendly.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Set NEXT_PUBLIC_CALENDLY_URL in your environment to enable online booking.
                  </p>
                  <a
                    href="tel:+15553962789"
                    className="btn-primary mt-6"
                  >
                    Call to Schedule
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Calendly script */}
      {calendlyUrl && (
        <script
          type="text/javascript"
          src="https://assets.calendly.com/assets/external/widget.js"
          async
        />
      )}
    </>
  );
}
