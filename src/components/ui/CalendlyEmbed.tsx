'use client';

import { useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CalendlyEmbedProps {
  url: string;
}

export function CalendlyEmbed({ url }: CalendlyEmbedProps) {
  useEffect(() => {
    // Load Calendly widget script
    const existing = document.getElementById('calendly-script');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'calendly-script';
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Don't remove on unmount — Calendly initializes once and is reused
    };
  }, []);

  return (
    <div
      className="calendly-inline-widget w-full rounded-2xl overflow-hidden"
      data-url={`${url}?hide_gdpr_banner=1&hide_event_type_details=0&primary_color=a56a17`}
      style={{ minWidth: '320px', height: '700px' }}
    />
  );
}

export function CalendlyFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-gray-200">
      <Calendar className="h-12 w-12 text-gray-300 mb-4" />
      <p className="text-sm font-medium text-gray-500">Online scheduling coming soon</p>
      <p className="text-xs text-gray-400 mt-1 mb-6">
        Set NEXT_PUBLIC_CALENDLY_URL to enable booking
      </p>
      <a href="tel:+12252846854" className="btn-primary text-sm">
        Call to Schedule
      </a>
    </div>
  );
}
