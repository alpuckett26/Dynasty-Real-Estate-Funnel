'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash immediately on load
    const timer = setTimeout(() => {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy-950 mb-0.5">We use cookies</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              We use cookies to improve your experience and analyze site traffic.{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
