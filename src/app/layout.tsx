import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { PixelScripts } from '@/components/layout/PixelScripts';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { RatesWidget } from '@/components/ui/RatesWidget';
import {
  SITE_URL,
  AGENT_NAME,
  BROKERAGE_NAME,
  AGENT_PHONE,
  AGENT_EMAIL,
  SERVICE_AREAS,
} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Adreanne The Realtor | Baton Rouge Real Estate',
    template: '%s | Adreanne The Realtor',
  },
  description:
    'Adreanne Aranha is Baton Rouge\'s trusted real estate agent specializing in first-time homebuyers, healthcare workers, and relocation. Expert guidance, real results.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Adreanne The Realtor',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const realEstateAgentJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#agent`,
  name: AGENT_NAME,
  alternateName: 'Adreanne The Realtor',
  url: SITE_URL,
  telephone: AGENT_PHONE,
  email: AGENT_EMAIL,
  description:
    'Baton Rouge real estate agent specializing in first-time homebuyers, healthcare workers, down payment assistance programs, and relocation.',
  worksFor: { '@type': 'Organization', name: BROKERAGE_NAME },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Baton Rouge',
    addressRegion: 'LA',
    addressCountry: 'US',
  },
  areaServed: SERVICE_AREAS.map((name) => ({ '@type': 'City', name })),
  knowsAbout: [
    'First-time homebuyer programs',
    'Down payment assistance',
    'FHA loans',
    'Credit repair for homebuyers',
    'Relocation',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateAgentJsonLd) }}
        />
      </head>
      <body>
        <PixelScripts />
        <Header />
        <main className="min-h-screen pt-[72px]">{children}</main>
        <Footer />
        <StickyCTA />
        <ChatWidget />
        <CookieBanner />
      </body>
    </html>
  );
}
