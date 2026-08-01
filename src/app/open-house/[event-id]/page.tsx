import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Bed, Bath, Square, Clock, CheckCircle } from 'lucide-react';
import { OpenHouseSignIn } from '@/components/forms/OpenHouseSignIn';
import openHousesData from '../../../../data/open-houses.json';

interface OpenHouseEvent {
  id: string;
  address: string;
  neighborhood: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  agentName: string;
  agentPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  highlights: string[];
  dpaProgramEligible: boolean;
  active: boolean;
}

const openHouses = openHousesData as OpenHouseEvent[];

function getOpenHouse(id: string): OpenHouseEvent | undefined {
  return openHouses.find((e) => e.id === id && e.active);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'event-id': string }>;
}): Promise<Metadata> {
  const { 'event-id': eventId } = await params;
  const event = getOpenHouse(eventId);
  if (!event) return { title: 'Open House | SMRG Real Estate', robots: { index: false } };
  return {
    title: `Open House: ${event.address} | SMRG Real Estate`,
    description: `Join us for an open house at ${event.address} — ${event.bedrooms}BR/${event.bathrooms}BA, ${event.price}. ${event.startTime}–${event.endTime} on ${event.date}.`,
    robots: { index: false },
  };
}

export default async function OpenHousePage({
  params,
}: {
  params: Promise<{ 'event-id': string }>;
}) {
  const { 'event-id': eventId } = await params;
  const event = getOpenHouse(eventId);

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Property header */}
      <section className="bg-navy-950 py-12">
        <div className="container-narrow">
          <div className="flex items-center gap-2 text-brand-400 text-sm font-semibold mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Open House — {event.neighborhood}
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
              <MapPin className="h-4 w-4" /> {event.neighborhood}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {event.startTime} – {event.endTime}
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

            {event.highlights.length > 0 && (
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> {h}
                  </li>
                ))}
              </ul>
            )}

            {event.dpaProgramEligible && (
              <div className="mt-4 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-800">
                <span className="font-semibold">Down Payment Assistance eligible</span> — this property may qualify for up to $15,000 in DPA. Ask the agent for details.
              </div>
            )}

            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-gray-500">
                Presented by <span className="font-medium text-gray-700">{event.agentName}</span>{' '}
                &nbsp;·&nbsp;
                <a href={`tel:${event.agentPhone}`} className="text-brand-600 hover:underline">
                  {event.agentPhone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
