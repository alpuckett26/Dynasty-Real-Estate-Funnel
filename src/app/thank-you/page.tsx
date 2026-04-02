import type { Metadata } from 'next';
import { CheckCircle, Clock, Phone, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'You\'re Registered | Dynasty Real Estate',
  description: 'Registration confirmed. Book your free consultation now.',
  robots: { index: false },
};

export default function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; intent?: string; route?: string }>;
}) {
  return <ThankYouContent searchParamsPromise={searchParams} />;
}

async function ThankYouContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ name?: string; intent?: string; route?: string }>;
}) {
  const params = await searchParamsPromise;
  const name = params.name ?? 'there';
  const intent = params.intent ?? 'buyer';
  const isHot = params.route === 'hot';
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  const headlineMap: Record<string, string> = {
    buyer: "You're registered! Let's find your perfect home.",
    seller: "You're registered! Let's get your home sold.",
    both: "You're registered! Let's plan your move.",
  };

  const headline = headlineMap[intent] ?? "You're registered!";

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-narrow text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500 mb-6 mx-auto">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 text-lg text-navy-300 max-w-xl mx-auto">
            Hi {name} — we got your info and you&apos;re all set. The next step is booking your free consultation so we can build your personalized plan.
          </p>
          {isHot && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">
              <Phone className="h-4 w-4" />
              High priority — expect a call within 30 minutes
            </div>
          )}
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-16 bg-white">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-navy-900">
              Step 2: Book your free consultation
            </h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              Pick a time that works for you — video call, phone, or in-person. No pressure, just expert advice.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 text-brand-500" />
              Typical consultation: 20–30 minutes
            </div>
          </div>

          {/* Calendar embed or fallback */}
          {calendlyUrl ? (
            <>
              <div
                className="calendly-inline-widget rounded-2xl overflow-hidden shadow-lg border border-gray-100"
                data-url={`${calendlyUrl}?hide_gdpr_banner=1&primary_color=b96614`}
                style={{ minWidth: '320px', height: '700px' }}
              />
              <script
                type="text/javascript"
                src="https://assets.calendly.com/assets/external/widget.js"
                async
              />
            </>
          ) : (
            <div className="card text-center max-w-md mx-auto shadow-lg">
              <Calendar className="h-12 w-12 text-brand-500 mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">Schedule your consultation</h3>
              <p className="text-sm text-gray-500 mb-6">
                Our team will reach out within 5 minutes to confirm a time — or call us now.
              </p>
              <a
                href="tel:+15553962789"
                className="btn-primary w-full justify-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Now: (555) DYN-ASTY
              </a>
              <p className="mt-4 text-xs text-gray-400">Mon–Sun, 7am–9pm</p>
            </div>
          )}
        </div>
      </section>

      {/* What to expect */}
      <section className="py-12 bg-gray-50">
        <div className="container-narrow">
          <h2 className="text-xl font-serif font-bold text-navy-900 text-center mb-6">
            What happens on your consultation
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'We listen first',
                desc: 'Tell us your goals, timeline, and concerns. No pitch, no pressure.',
              },
              {
                n: '02',
                title: 'Personalized strategy',
                desc: 'We build a plan specific to your situation — budget, area, timeline, and programs you qualify for.',
              },
              {
                n: '03',
                title: 'Clear next steps',
                desc: "You'll leave knowing exactly what to do next — whether that's pre-approval, a showing, or just more research.",
              },
            ].map((s) => (
              <div key={s.n} className="card text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-serif font-bold text-lg mb-3">
                  {s.n}
                </div>
                <h3 className="font-semibold text-navy-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
