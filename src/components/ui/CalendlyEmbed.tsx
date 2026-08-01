'use client';

import { useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { trackBookingComplete } from '@/components/layout/PixelScripts';

const SCRIPT_ID = 'calendly-script';
const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';

interface CalendlyEmbedProps {
  url: string;
}

interface CalendlyGlobal {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
}

function loadWidgetScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Calendly?: CalendlyGlobal }).Calendly) return resolve();

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('calendly script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('calendly script failed')), { once: true });
    document.body.appendChild(script);
  });
}

export function CalendlyEmbed({ url }: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // Initialise explicitly rather than relying on Calendly's one-shot DOM scan
    // at script load. The scan only runs once, so on a client-side navigation —
    // or any remount — the script is already present, no scan happens, and the
    // container renders as an empty box.
    loadWidgetScript()
      .then(() => {
        if (cancelled) return;
        const calendly = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
        if (!calendly) return;
        container.innerHTML = ''; // avoid stacking iframes on re-init
        calendly.initInlineWidget({
          url: `${url}?hide_gdpr_banner=1&hide_event_type_details=0&primary_color=1d4ed8`,
          parentElement: container,
        });
      })
      .catch((err) => console.error('[CalendlyEmbed] Failed to load booking widget:', err));

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Calendly posts a message to the parent window when a booking is confirmed.
  // This is the only signal we get — the booking itself happens inside the iframe.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.origin.endsWith('calendly.com')) return;
      const data = e.data as { event?: string } | null;
      if (data?.event === 'calendly.event_scheduled') {
        trackBookingComplete();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget w-full rounded-2xl overflow-hidden"
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
