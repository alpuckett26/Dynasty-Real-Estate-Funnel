'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/buy', label: 'Buy' },
  { href: '/sell', label: 'Sell' },
  { href: '/relocate', label: 'Relocate' },
  { href: '/neighborhood/downtown', label: 'Neighborhoods' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="container-wide flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-navy-900">Dynasty</span>
          <span className="text-sm font-medium text-brand-600 hidden sm:block">Real Estate</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+1-555-DYNASTY"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600"
          >
            <Phone className="h-4 w-4" />
            <span>(555) DYN-ASTY</span>
          </a>
          <Link href="/book" className="btn-primary text-xs px-4 py-2">
            Book Free Consult
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300',
          open ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-brand-600"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <a href="tel:+1-555-DYNASTY" className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              (555) DYN-ASTY
            </a>
            <Link href="/book" className="btn-primary text-center text-sm" onClick={() => setOpen(false)}>
              Book Free Consult
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
