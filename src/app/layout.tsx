import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { PixelScripts } from '@/components/layout/PixelScripts';
import { RatesWidget } from '@/components/ui/RatesWidget';

export const metadata: Metadata = {
  title: {
    default: 'Adreanne The Realtor | Baton Rouge Real Estate',
    template: '%s | Adreanne The Realtor',
  },
  description:
    'Adreanne Aranha is Baton Rouge\'s trusted real estate agent specializing in first-time homebuyers, healthcare workers, and relocation. Expert guidance, real results.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Adreanne The Realtor',
  },
  robots: {
    index: true,
    follow: true,
  },
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
      </head>
      <body>
        <PixelScripts />
        <Header />
        <main className="min-h-screen pt-[72px]">{children}</main>
        <Footer />
        <StickyCTA />
        <ChatWidget />
      </body>
    </html>
  );
}
