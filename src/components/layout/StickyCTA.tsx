'use client';

import Link from 'next/link';
import { Phone, Calendar, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-2xl">
      <div className="flex items-center divide-x divide-gray-200">
        <a
          href="tel:+15553962789"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Phone className="h-5 w-5 text-brand-600" />
          Call Us
        </a>
        <Link
          href="/sell"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Home className="h-5 w-5 text-brand-600" />
          Get Value
        </Link>
        <Link
          href="/book"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors"
        >
          <Calendar className="h-5 w-5" />
          Book Call
        </Link>
      </div>
    </div>
  );
}
