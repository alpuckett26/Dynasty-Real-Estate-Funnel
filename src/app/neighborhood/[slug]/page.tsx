import type { Metadata } from 'next';
import { MapPin, School, Coffee, TreePine, TrendingUp } from 'lucide-react';
import { LeadForm } from '@/components/forms/LeadForm';

// Static neighborhood data — in production, fetch from CMS or DB
const NEIGHBORHOODS: Record<string, {
  name: string;
  tagline: string;
  description: string;
  medianPrice: string;
  priceChange: string;
  walkScore: number;
  highlights: string[];
  schools: string[];
  amenities: string[];
}> = {
  downtown: {
    name: 'Downtown Core',
    tagline: 'Urban living at its finest',
    description: 'The heartbeat of the city. Downtown offers a walkable lifestyle with world-class dining, entertainment, and easy access to major employers. Loft-style condos, historic brownstones, and modern high-rises define the landscape.',
    medianPrice: '$485,000',
    priceChange: '+8.2%',
    walkScore: 95,
    highlights: ['Walk Score 95', 'Avg. 8 days on market', 'Strong rental demand'],
    schools: ['Metro Arts High School', 'Downtown Preparatory Academy', 'City Learning Center'],
    amenities: ['Whole Foods', 'Trader Joe\'s', 'Riverfront Park', 'Metro Station', 'Farmers Market', 'Multiple gyms'],
  },
  midtown: {
    name: 'Midtown',
    tagline: 'The perfect work-life balance',
    description: 'Midtown strikes the ideal balance between urban energy and residential calm. Tree-lined streets, boutique shops, and a thriving restaurant scene make it one of the city\'s most sought-after neighborhoods.',
    medianPrice: '$395,000',
    priceChange: '+5.7%',
    walkScore: 82,
    highlights: ['Walk Score 82', 'Top-rated elementary schools', 'Strong appreciation'],
    schools: ['Midtown Elementary', 'Central Middle School', 'City Preparatory High'],
    amenities: ['Whole Foods', 'Midtown Park', 'Community Pool', 'Coffee shops', 'Yoga studios'],
  },
  suburbs: {
    name: 'Suburbs North',
    tagline: 'Spacious living with top schools',
    description: 'Families love the Suburbs North for its excellent schools, large lots, and quiet streets. With easy highway access and a welcoming community, it\'s the ideal place to plant roots.',
    medianPrice: '$560,000',
    priceChange: '+4.1%',
    walkScore: 42,
    highlights: ['Top-rated school district', 'Avg. lot size 0.35 acres', 'Low crime rate'],
    schools: ['North Elementary', 'Northview Middle School', 'North High School (A+ rated)'],
    amenities: ['Target', 'Costco', 'Community Park', 'YMCA', 'Little League Fields'],
  },
};

const DEFAULT_NEIGHBORHOOD = {
  name: 'Local Neighborhood',
  tagline: 'Discover this community',
  description: 'This is a thriving community with great amenities, convenient access, and strong real estate values. Contact our team for the latest market data and available listings.',
  medianPrice: 'Contact us',
  priceChange: 'N/A',
  walkScore: 70,
  highlights: ['Strong community', 'Great location', 'Active market'],
  schools: ['Contact us for school info'],
  amenities: ['Contact us for amenity details'],
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const n = NEIGHBORHOODS[params.slug] ?? DEFAULT_NEIGHBORHOOD;
  return {
    title: `${n.name} Neighborhood Guide | Dynasty Real Estate`,
    description: `${n.tagline} — ${n.description.slice(0, 130)}...`,
  };
}

export default function NeighborhoodPage({ params }: { params: { slug: string } }) {
  const n = NEIGHBORHOODS[params.slug] ?? { ...DEFAULT_NEIGHBORHOOD, name: params.slug.replace(/-/g, ' ') };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 py-20">
        <div className="container-wide">
          <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold mb-3">
            <MapPin className="h-4 w-4" />
            Neighborhood Guide
          </div>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">{n.name}</h1>
          <p className="mt-2 text-xl text-navy-300">{n.tagline}</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-600 py-6">
        <div className="container-wide flex flex-wrap gap-8 justify-center md:justify-start">
          {[
            { label: 'Median Home Price', value: n.medianPrice },
            { label: 'Year-over-Year Change', value: n.priceChange },
            { label: 'Walk Score', value: `${n.walkScore}/100` },
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
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-4">About {n.name}</h2>
              <p className="text-gray-700 leading-relaxed">{n.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {n.highlights.map((h) => (
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
                {n.schools.map((s) => (
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
                {n.amenities.map((a) => (
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
              source={`neighborhood-${params.slug}`}
              heading={`Interested in ${n.name}?`}
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
            areaServed: n.name,
            description: n.description,
          }),
        }}
      />
    </>
  );
}

// Generate static paths for known neighborhoods
export function generateStaticParams() {
  return Object.keys(NEIGHBORHOODS).map((slug) => ({ slug }));
}
