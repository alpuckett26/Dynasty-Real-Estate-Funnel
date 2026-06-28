import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, School, Coffee, TreePine, TrendingUp } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';
import neighborhoodsData from '../../../../data/neighborhoods.json';

interface Neighborhood {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  medianPrice: string;
  priceChange: string;
  walkScore: number;
  highlights: string[];
  schools: string[];
  amenities: string[];
}

const neighborhoods = neighborhoodsData as Neighborhood[];

function getNeighborhood(slug: string): Neighborhood | undefined {
  return neighborhoods.find((n) => n.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = getNeighborhood(slug);
  if (!n) return { title: 'Neighborhood Not Found | Dynasty Real Estate' };
  return {
    title: `${n.name} Neighborhood Guide | Dynasty Real Estate`,
    description: `${n.tagline} — ${n.description.slice(0, 130)}...`,
  };
}

export default async function NeighborhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = getNeighborhood(slug);

  if (!n) notFound();
  // TypeScript control-flow: notFound() throws, so n is defined below
  const hood = n!;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold mb-3">
            <MapPin className="h-4 w-4" />
            Neighborhood Guide
          </div>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">{hood.name}</h1>
          <p className="mt-2 text-xl text-navy-300">{hood.tagline}</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-600 py-6">
        <div className="container-wide flex flex-wrap gap-8 justify-center md:justify-start">
          {[
            { label: 'Median Home Price', value: hood.medianPrice },
            { label: 'Year-over-Year Change', value: hood.priceChange },
            { label: 'Walk Score', value: `${hood.walkScore}/100` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-serif font-bold text-white">{s.value}</p>
              <p className="text-xs text-brand-100 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content + Form */}
      <section className="py-20">
        <div className="container-wide grid md:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="md:col-span-2 space-y-10">
            {/* Overview */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-4">About {hood.name}</h2>
              <p className="text-gray-700 leading-relaxed">{hood.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hood.highlights.map((h) => (
                  <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700">
                    <TrendingUp className="h-3 w-3" /> {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Schools */}
            <div>
              <h2 className="text-xl font-serif font-bold text-navy-900 mb-4 flex items-center gap-2">
                <School className="h-5 w-5 text-brand-600" /> Schools
              </h2>
              <ul className="space-y-2">
                {hood.schools.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-serif font-bold text-navy-900 mb-4 flex items-center gap-2">
                <Coffee className="h-5 w-5 text-brand-600" /> Nearby Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {hood.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                    <TreePine className="h-3 w-3 text-green-600" /> {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lead form sidebar */}
          <div>
            <LeadForm
              source={`neighborhood-${slug}`}
              heading={`Interested in ${hood.name}?`}
              subheading="Connect with an agent who knows this neighborhood inside and out."
              showTimeline
              showFinancing
              ctaLabel="Find Homes in This Area"
            />
          </div>
        </div>
      </section>

      {/* Schema markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateAgent',
            name: 'Dynasty Real Estate',
            areaServed: hood.name,
            description: hood.description,
          }),
        }}
      />
    </>
  );
}

export function generateStaticParams() {
  return neighborhoods.map((n) => ({ slug: n.slug }));
}
