import type { Metadata } from 'next';
import { CheckCircle, TrendingUp, Clock, Shield } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';

export const metadata: Metadata = {
  title: 'Get Ready to Buy | Credit & Financial Prep | Dynasty Real Estate',
  description:
    'Not quite ready to buy? Dynasty connects you with credit repair, down payment assistance, and lender resources — then keeps you on track until you are.',
};

const MYTHS = [
  {
    myth: '"I need perfect credit."',
    truth: 'FHA loans go as low as 580 credit score. Some DPA programs work with scores as low as 620.',
  },
  {
    myth: '"I need 20% down."',
    truth: 'Many programs require 3–5% down. Down payment assistance can cover most or all of that.',
  },
  {
    myth: '"I have to wait years."',
    truth: 'With the right plan, some clients go from credit repair to keys in 6–12 months.',
  },
  {
    myth: '"No one will help me."',
    truth: "We work with buyers at every stage — that's what we're here for.",
  },
];

const STEPS = [
  {
    icon: Shield,
    title: 'Free credit review',
    desc: 'We connect you with a trusted credit counselor who reviews your report and creates an action plan — at no cost.',
  },
  {
    icon: TrendingUp,
    title: 'Lender matching',
    desc: 'We introduce you to lenders who specialize in first-time buyers, FHA, and DPA programs in your area.',
  },
  {
    icon: Clock,
    title: 'Monthly check-ins',
    desc: 'We stay in your corner. Monthly updates on your progress, new programs you qualify for, and market conditions.',
  },
  {
    icon: CheckCircle,
    title: 'Ready when you are',
    desc: "When your credit and finances are ready, your Dynasty agent picks up right where we left off — no starting over.",
  },
];

export default function GetReadyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">
              Get Ready to Buy
            </p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              You may be closer to homeownership than you think
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Not quite ready yet? That&apos;s exactly why we built this program. We help buyers who need credit repair, a lender, or down payment assistance get to the finish line — on a realistic timeline.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                'Free credit review and action plan',
                'Lender referrals specializing in FHA + DPA',
                'Down payment assistance programs',
                'Monthly check-ins until you\'re ready',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-navy-200">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <IntakeForm
            source="get-ready"
            defaultIntent="buyer"
            heading="Start Your Path to Homeownership"
            subheading="Register now and we'll build a personalized plan for where you are today."
            ctaLabel="Get My Free Action Plan"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Myth busting */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Myths that are keeping you from your home</h2>
            <p className="section-subtitle">Let&apos;s clear them up.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {MYTHS.map((m) => (
              <div key={m.myth} className="card border-l-4 border-brand-500">
                <p className="text-sm font-semibold text-gray-400 italic mb-2">{m.myth}</p>
                <p className="text-sm text-gray-700 leading-relaxed font-medium text-navy-900">
                  ✅ {m.truth}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we help */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How Dynasty gets you there</h2>
            <p className="section-subtitle">A structured plan — not just advice.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.title} className="card text-center hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 mb-4">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Your journey starts today</h2>
          <p className="mt-3 text-brand-100">
            Register now and we&apos;ll reach out with your personalized next steps within 24 hours.
          </p>
          <a href="#" className="mt-6 inline-block rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
            Register for Free
          </a>
        </div>
      </section>
    </>
  );
}
