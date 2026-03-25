import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { PixelScripts } from '@/components/layout/PixelScripts';

export const metadata: Metadata = {
  title: {
    default: 'Dynasty Real Estate | Buy, Sell & Relocate with Confidence',
    template: '%s | Dynasty Real Estate',
  },
  description:
    'Dynasty Real Estate helps buyers, sellers, and relocating families navigate the market with expert guidance and cutting-edge technology.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Dynasty Real Estate',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PixelScripts />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <StickyCTA />
        <ChatWidget />
      </body>
    </html>
  );
}
