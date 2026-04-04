'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const PROGRAMS = [
  { href: '/register', label: 'First-Time Homebuyer', badge: 'Up to $15k DPA' },
  { href: '/register', label: 'Healthcare Worker Perks', badge: 'Grants Available' },
  { href: '/get-ready', label: 'Credit Repair Path', badge: null },
  { href: '/sell-your-home', label: 'Free Home Valuation', badge: null },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100">
      <nav className="container-wide flex h-16 items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold font-serif">
            A
          </div>
          <div className="leading-none">
            <span className="font-serif text-lg font-bold text-navy-950 tracking-tight">Adreanne</span>
            <span className="text-xs font-medium text-brand-600 block -mt-0.5">The Realtor</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <Link href="/buy" className="text-sm font-medium text-gray-600 hover:text-navy-950 transition-colors">
            Buy
          </Link>
          <Link href="/sell-your-home" className="text-sm font-medium text-gray-600 hover:text-navy-950 transition-colors">
            Sell
          </Link>
          <Link href="/relocate" className="text-sm font-medium text-gray-600 hover:text-navy-950 transition-colors">
            Relocate
          </Link>
          <Link href="/neighborhood/downtown" className="text-sm font-medium text-gray-600 hover:text-navy-950 transition-colors">
            Neighborhoods
          </Link>

          {/* Programs dropdown */}
          <div className="relative" onMouseEnter={() => setProgramsOpen(true)} onMouseLeave={() => setProgramsOpen(false)}>
            <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-navy-950 transition-colors">
              Programs
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', programsOpen && 'rotate-180')} />
            </button>
            {programsOpen && (
              <div className="absolute left-0 top-full pt-2 w-72">
                <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/8 py-2 overflow-hidden">
                  {PROGRAMS.map((p) => (
                    <Link
                      key={p.label}
                      href={p.href}
                      className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                      onClick={() => setProgramsOpen(false)}
                    >
                      <span className="font-medium">{p.label}</span>
                      {p.badge && (
                        <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          {p.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+12252846854"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            (225) 284-6854
          </a>
          <Link href="/book" className="btn-primary text-xs px-5 py-2.5">
            Book Free Consult
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
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
          open ? 'max-h-[520px]' : 'max-h-0'
        )}
      >
        <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-0.5">
          {[
            { href: '/buy', label: 'Buy a Home' },
            { href: '/sell-your-home', label: 'Sell My Home' },
            { href: '/relocate', label: 'Relocate' },
            { href: '/neighborhood/downtown', label: 'Neighborhoods' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy-950 transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-1">Programs</p>
            {PROGRAMS.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="font-medium">{p.label}</span>
                {p.badge && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {p.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-2.5 px-1">
            <a href="tel:+12252846854" className="flex items-center gap-2 text-sm text-gray-600 px-2">
              <Phone className="h-4 w-4" />
              (225) 284-6854
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
