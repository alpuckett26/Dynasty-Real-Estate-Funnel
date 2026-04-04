import type { Metadata } from 'next';
import { CheckCircle, TrendingUp, Clock, Shield } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';

export const metadata: Metadata = {
  title: 'Get Ready to Buy | Credit & Financial Prep | Adreanne The Realtor',
  description:
    'Not quite ready to buy? Adreanne connects you with credit repair, down payment assistance, and lender resources — and keeps you on track until you are.',
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
    truth: 'With the right plan, some buyers go from credit repair to keys in 6–12 months.',
  },
  {
    myth: '"No one will help me."',
    truth: "I work with buyers at every stage — that's exactly what this program is for.",
  },
];

const STEPS = [
  {
    icon: Shield,
    title: 'Free credit review',
    desc: 'I connect you with a trusted credit counselor who reviews your report and creates an action plan — at no cost to you.',
  },
  {
    icon: TrendingUp,
    title: 'Lender matching',
    desc: 'I introduce you to lenders who specialize in first-time buyers, FHA, and DPA programs in the Baton Rouge area.',
  },
  {
    icon: Clock,
    title: 'Monthly check-ins',
    desc: 'I stay in your corner. Monthly updates on your progress, new programs you qualify for, and market conditions.',
  },
  {
    icon: CheckCircle,
    title: 'Ready when you are',
    desc: "When your credit and finances are ready, we pick up right where we left off — no starting over, no losing your spot.",
  },
];

export default function GetReadyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-start">
          <div className="pt-4">
            <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Get Ready to Buy
            </p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              You&apos;re closer to homeownership than you think
            </h1>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Not quite ready yet? That&apos;s exactly why I built this program. I help buyers who need credit repair,
              a lender, or down payment assistance get to the finish line — on a realistic timeline.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                'Free credit review and action plan',
                'Lender referrals specializing in FHA + DPA',
                'Down payment assistance programs',
                'Monthly check-ins until you\'re ready',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
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
            subheading="Register now and I'll build a personalized plan for where you are today."
            ctaLabel="Get My Free Action Plan"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Myth busting */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Myths keeping you from your home</h2>
            <p className="section-subtitle">Let&apos;s clear them up right now.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {MYTHS.map((m) => (
              <div key={m.myth} className="card border-l-4 border-brand-500">
                <p className="text-sm font-medium text-gray-400 italic mb-2">{m.myth}</p>
                <p className="text-sm text-navy-950 leading-relaxed font-medium">
                  ✅ {m.truth}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How I help */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How I get you there</h2>
            <p className="section-subtitle">A structured plan — not just advice.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.title} className="card text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 mb-4">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-950 mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Your journey starts today</h2>
          <p className="mt-3 text-brand-100 text-sm">
            Register and I&apos;ll reach out with your personalized next steps within 24 hours.
          </p>
          <a href="/register" className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors shadow-sm">
            Register for Free
          </a>
        </div>
      </section>
    </>
  );
}
