import type { Metadata } from 'next';
import { CheckCircle, Shield, DollarSign, Home, Users } from 'lucide-react';
import { IntakeForm } from '@/components/forms/IntakeForm';

export const metadata: Metadata = {
  title: 'First-Time Homebuyer & Healthcare Worker Program | Dynasty Real Estate',
  description:
    'Register for Dynasty\'s exclusive homebuyer program. First-time buyers and healthcare workers may qualify for down payment assistance, special rates, and dedicated agent support.',
};

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Down Payment Assistance',
    desc: 'We connect you with programs that can contribute up to $15,000 toward your down payment and closing costs.',
  },
  {
    icon: Shield,
    title: 'Healthcare Worker Perks',
    desc: 'Nurses, doctors, EMTs, and other healthcare professionals may qualify for additional grants and reduced fees.',
  },
  {
    icon: Home,
    title: 'First-Time Buyer Roadmap',
    desc: 'Step-by-step guidance from pre-approval to keys — no experience needed, we handle everything.',
  },
  {
    icon: Users,
    title: 'Dedicated Agent Support',
    desc: 'Your own buyer agent at zero cost to you. The seller pays our commission — you get expert representation free.',
  },
];

const STEPS = [
  { step: '01', title: 'Register', desc: 'Fill out the form — takes 2 minutes.' },
  { step: '02', title: 'Book Your Consultation', desc: 'We match you with a specialist and build your personalized buying plan.' },
  { step: '03', title: 'Get Pre-Approved', desc: 'We connect you with trusted lenders and DPA programs you qualify for.' },
  { step: '04', title: 'Find Your Home', desc: 'Tour homes on your schedule. We handle every detail through closing.' },
];

export default function RegisterPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white mb-4">
              <Shield className="h-3.5 w-3.5" />
              First-Time Homebuyer &amp; Healthcare Worker Program
            </div>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Homeownership is closer than you think
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Whether you&apos;re a first-time buyer, a healthcare hero, or just unsure where to start — our specialists are here to guide you from day one. You may qualify for programs that cover your down payment.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                'Down payment assistance up to $15,000',
                'Healthcare worker grants available',
                'No-cost buyer representation',
                'Credit issues? We have solutions',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-navy-200">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <IntakeForm
            source="register-fthb"
            defaultIntent="buyer"
            heading="Register for Free"
            subheading="Takes 2 minutes. We respond within 5 minutes during business hours."
            ctaLabel="Register & Book My Consultation"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Why register with Dynasty</h2>
            <p className="section-subtitle">Programs and support you won&apos;t find everywhere.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card text-center hover:shadow-md transition-all">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-4">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Four steps to your first home.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-5">
            {STEPS.map((s) => (
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

      {/* Social proof / disclaimer */}
      <section className="py-12 bg-navy-950">
        <div className="container-narrow text-center">
          <p className="text-navy-300 text-sm max-w-xl mx-auto leading-relaxed">
            Dynasty Real Estate is an equal opportunity housing provider. Down payment assistance programs vary by location and eligibility. Program availability is subject to change. Consult your Dynasty agent for current program details.
          </p>
        </div>
      </section>
    </>
  );
}
