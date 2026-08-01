import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, School, Briefcase, Car, CheckCircle, Calendar } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';
import neighborhoodsData from '../../../data/neighborhoods.json';

export const metadata: Metadata = {
  title: 'Relocation Services | Moving to a New City?',
  description:
    'SMRG Real Estate\'s relocation specialists help you navigate your move with local expertise, neighborhood guides, and a seamless transition.',
};

const RELOCATION_SERVICES = [
  {
    icon: MapPin,
    title: 'Neighborhood Matching',
    desc: 'Tell us your lifestyle and priorities — we\'ll match you to neighborhoods that fit your needs.',
  },
  {
    icon: School,
    title: 'School Research',
    desc: 'Comprehensive school district data and enrollment guidance for families moving with children.',
  },
  {
    icon: Briefcase,
    title: 'Corporate Relocation',
    desc: 'Dedicated service for corporate transferees including temporary housing, rush timelines, and guaranteed buyout coordination.',
  },
  {
    icon: Car,
    title: 'Virtual Tours',
    desc: 'Can\'t be here in person? We conduct virtual showings with real-time guidance and detailed walkthroughs.',
  },
];

const NEIGHBORHOODS = (neighborhoodsData as { slug: string; name: string }[]).map(
  ({ slug, name }) => ({ slug, name })
);

export default function RelocatePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-3">Relocate with Dynasty</p>
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl leading-tight">
              Moving to a new city shouldn&apos;t be stressful
            </h1>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Our relocation specialists know every neighborhood, school district, and commute route. We make sure your move is the fresh start you deserve.
            </p>
            <div className="mt-6 space-y-2">
              {[
                'Free relocation consultation',
                'Virtual tour capability',
                'Corporate relocation specialist',
                'School and commute research included',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-navy-200">
                  <CheckCircle className="h-4 w-4 text-brand-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <LeadForm
            source="relocate-page"
            intent="buyer"
            heading="Plan My Relocation"
            subheading="Tell us where you're coming from and where you want to be."
            showTimeline
            showMessage
            ctaLabel="Connect Me with a Relocation Specialist"
            className="shadow-2xl"
          />
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="section-title">Relocation services</h2>
            <p className="section-subtitle">Everything you need for a smooth transition.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {RELOCATION_SERVICES.map((s) => (
              <div key={s.title} className="card flex items-start gap-4">
                <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <s.icon className="h-5 w-5" />
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

      {/* Neighborhoods preview */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-10">
            <h2 className="section-title">Explore neighborhoods</h2>
            <p className="section-subtitle">Detailed guides for every community in the area.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {NEIGHBORHOODS.map(({ slug, name }) => (
              <Link
                key={slug}
                href={`/neighborhood/${slug}`}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-all"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="container-narrow text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Let&apos;s plan your move together</h2>
          <p className="mt-3 text-brand-100">Free consultation. Virtual or in-person. No commitment.</p>
          <a href="/book" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
            <Calendar className="h-4 w-4" />
            Book My Free Relocation Consult
          </a>
        </div>
      </section>
    </>
  );
}
