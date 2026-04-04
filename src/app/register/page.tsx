import type { Metadata } from 'next';
import { CheckCircle, Shield, DollarSign, Home, Users } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';
import { RatesWidget } from '@/components/ui/RatesWidget';

export const metadata: Metadata = {
  title: 'First-Time Homebuyer & Healthcare Worker Program | Adreanne The Realtor',
  description:
    'First-time buyers and healthcare workers in Baton Rouge may qualify for up to $15,000 in down payment assistance. Register for a free consultation with Adreanne.',
};

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Down Payment Assistance',
    desc: 'I connect buyers with programs that can contribute up to $15,000 toward down payment and closing costs. Most people don\'t know they qualify.',
  },
  {
    icon: Shield,
    title: 'Healthcare Worker Perks',
    desc: 'Nurses, doctors, EMTs, and healthcare professionals may qualify for additional grants and reduced fees. You\'ve earned it.',
  },
  {
    icon: Home,
    title: 'First-Time Buyer Roadmap',
    desc: 'Step-by-step guidance from pre-approval to keys — no experience needed. I handle everything and keep you informed the whole way.',
  },
  {
    icon: Users,
    title: 'Free Buyer Representation',
    desc: 'Your own dedicated agent at zero cost to you. The seller pays my commission — you get expert representation for free.',
  },
];

const STEPS = [
  { step: '01', title: 'Register', desc: 'Fill out the form — takes 2 minutes.' },
  { step: '02', title: 'Free Consultation', desc: 'I\'ll call you, learn your situation, and show you exactly which programs you qualify for.' },
  { step: '03', title: 'Get Pre-Approved', desc: 'I connect you with trusted lenders and DPA programs in your area — no guesswork.' },
  { step: '04', title: 'Keys in Hand', desc: 'Tour homes, make the right offer, and close. I\'m with you every step of the way.' },
];

export default function RegisterPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 to-navy-900 py-20 -mt-[72px] pt-[calc(72px+5rem)]">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-start">
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/20 border border-brand-600/30 px-4 py-1.5 text-xs font-semibold text-brand-300 mb-5">
              <Shield className="h-3.5 w-3.5" />
              First-Time Buyer &amp; Healthcare Worker Program
            </div>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Homeownership is closer than you think
            </h1>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Whether you&apos;re a first-time buyer or a healthcare professional — I specialize in getting people
              into homes using programs most agents don&apos;t even know exist. Let&apos;s see what you qualify for.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                'Down payment assistance up to $15,000',
                'Healthcare worker grants available',
                'Free buyer representation — no cost to you',
                'Credit not perfect? I have solutions',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <RatesWidget variant="card" showCTA={false} />
            <IntakeForm
              source="register-fthb"
              defaultIntent="buyer"
              heading="Register for Free"
              subheading="Takes 2 minutes. I'll respond within 5 minutes during business hours."
              ctaLabel="Register & Book My Consultation"
              className="shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">What you get when you register</h2>
            <p className="section-subtitle">Programs and support you won&apos;t find everywhere.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-950 mb-2 text-sm">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-navy-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Four steps to your first home.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {STEPS.map((s) => (
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

      {/* Disclaimer */}
      <section className="py-10 bg-navy-950">
        <div className="container-narrow text-center">
          <p className="text-gray-600 text-xs max-w-xl mx-auto leading-relaxed">
            Adreanne The Realtor is an equal opportunity housing provider. Down payment assistance programs vary
            by location and eligibility. Program availability is subject to change. Contact Adreanne for current
            program details applicable to your situation.
          </p>
        </div>
      </section>
    </>
  );
}
