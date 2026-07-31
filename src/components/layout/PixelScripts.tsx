'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { captureAttribution } from '@/lib/attribution';

export function PixelScripts() {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  // Record first-touch campaign params regardless of whether pixels are configured.
  useEffect(() => {
    captureAttribution();
  }, []);

  return (
    <>
      {/* Google Analytics 4 */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

// Tracking helpers for conversion events
export function trackLeadSubmit(leadType: string) {
  if (typeof window === 'undefined') return;
  // GA4
  if ((window as unknown as Record<string, unknown>).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'generate_lead', {
      event_category: 'Lead',
      event_label: leadType,
    });
  }
  // Meta Pixel
  if ((window as unknown as Record<string, unknown>).fbq) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'Lead', { lead_type: leadType });
  }
}

export function trackBookingComplete() {
  if (typeof window === 'undefined') return;
  if ((window as unknown as Record<string, unknown>).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'conversion', {
      event_category: 'Booking',
    });
  }
  if ((window as unknown as Record<string, unknown>).fbq) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'Schedule');
  }
}
