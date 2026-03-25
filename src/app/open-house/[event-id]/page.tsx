import type { Metadata } from 'next';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { OpenHouseSignIn } from '@/components/forms/OpenHouseSignIn';

export const metadata: Metadata = {
  title: 'Open House Sign-In | Dynasty Real Estate',
  description: 'Sign in to today\'s open house and receive property updates from Dynasty Real Estate.',
  robots: { index: false }, // Don't index individual open house pages
};

// In production, fetch event data from CMS or DB by event-id
function getOpenHouseData(eventId: string) {
  // Stub data — replace with DB lookup
  return {
    id: eventId,
    address: '1234 Maple Street, Anytown, ST 00000',
    price: '$575,000',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    agentName: 'Alex Dynasty',
    agentPhone: '(555) 000-0001',
    description: 'Beautiful 4-bedroom home with open floor plan, updated kitchen, and private backyard. Recent renovations include new roof, HVAC, and hardwood floors throughout.',
  };
}

export default function OpenHousePage({ params }: { params: { 'event-id': string } }) {
  const eventId = params['event-id'];
  const event = getOpenHouseData(eventId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Property header */}
      <section className="bg-navy-950 py-12">
        <div className="container-narrow">
          <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Open House — Today
          </div>
          <h1 className="font-serif text-3xl font-bold text-white">{event.address}</h1>
          <p className="mt-2 text-2xl font-semibold text-brand-400">{event.price}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-navy-300">
            <span className="flex items-center gap-1.5">
              <Bed className="h-4 w-4" /> {event.bedrooms} Bedrooms
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4" /> {event.bathrooms} Bathrooms
            </span>
            <span className="flex items-center gap-1.5">
              <Square className="h-4 w-4" /> {event.sqft.toLocaleString()} Sq Ft
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {event.address.split(',')[1]?.trim()}
            </span>
          </div>
        </div>
      </section>

      {/* Sign-in form */}
      <section className="py-12">
        <div className="container-narrow">
          <div className="card shadow-lg">
            <h2 className="font-serif text-2xl font-bold text-navy-900 mb-1 text-center">
              Welcome! Please sign in
            </h2>
            <p className="text-center text-sm text-gray-500 mb-8">
              Your information is kept private and never shared without your consent.
            </p>
            <OpenHouseSignIn eventId={eventId} propertyAddress={event.address} />
          </div>

          {/* Property details */}
          <div className="mt-8 card">
            <h3 className="font-semibold text-navy-900 mb-3">About this property</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-gray-500">
                Presented by <span className="font-medium text-gray-700">{event.agentName}</span> &nbsp;·&nbsp;
                <a href={`tel:${event.agentPhone}`} className="text-brand-600 hover:underline">{event.agentPhone}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
