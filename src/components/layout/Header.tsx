'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const PROGRAMS = [
  { href: '/register', label: 'First-Time Homebuyer', badge: 'Up to $15k DPA' },
  { href: '/register', label: 'Healthcare Worker Perks', badge: 'Grants Available' },
  { href: '/get-ready', label: 'Credit Repair Path', badge: null },
  { href: '/credit-path', label: 'Track My Progress', badge: null },
  { href: '/sell-your-home', label: 'Free Home Valuation', badge: null },
];

const TOOLS = [
  { href: '/mortgage-calculator', label: 'Mortgage Calculator', badge: null },
  { href: '/affordability', label: 'How Much Can I Afford?', badge: null },
  { href: '/rent-vs-buy', label: 'Rent vs. Buy', badge: null },
  { href: '/down-payment-assistance', label: 'Down Payment Assistance', badge: 'Free money' },
];

// Pages where the hero is dark — header starts transparent
const DARK_HERO_PAGES = ['/', '/buy', '/sell-your-home', '/relocate', '/register', '/get-ready'];

export function Header() {
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isDarkHero = DARK_HERO_PAGES.includes(pathname);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = isDarkHero && !scrolled && !open;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/98 backdrop-blur-md border-b border-gray-100 shadow-sm'
      )}
    >
      <nav className="container-wide flex h-18 items-center justify-between" style={{ height: '72px' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {/* Monogram circle — always solid, always visible */}
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold font-serif shadow-md transition-all',
            transparent ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'
          )}>
            A
          </div>
          <div className="leading-none">
            <span className={cn(
              'font-serif text-xl font-bold tracking-tight transition-colors drop-shadow-sm',
              transparent ? 'text-white' : 'text-navy-950'
            )}>Adreanne</span>
            <span className={cn(
              'text-xs font-semibold block tracking-wide uppercase transition-colors',
              transparent ? 'text-white/90' : 'text-brand-600'
            )}>The Realtor</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: '/buy', label: 'Buy' },
            { href: '/sell-your-home', label: 'Sell' },
            { href: '/relocate', label: 'Relocate' },
            { href: '/neighborhood/downtown-baton-rouge', label: 'Neighborhoods' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                transparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-gray-600 hover:text-navy-950'
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button className={cn(
              'flex items-center gap-1 text-sm font-medium transition-colors',
              transparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-navy-950'
            )}>
              Tools
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', toolsOpen && 'rotate-180')} />
            </button>
            {toolsOpen && (
              <div className="absolute left-0 top-full pt-2 w-64">
                <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 py-2 overflow-hidden">
                  {TOOLS.map((p) => (
                    <Link key={p.label} href={p.href}
                      className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                      onClick={() => setToolsOpen(false)}>
                      <span className="font-medium">{p.label}</span>
                      {p.badge && (
                        <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{p.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Programs dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProgramsOpen(true)}
            onMouseLeave={() => setProgramsOpen(false)}
          >
            <button className={cn(
              'flex items-center gap-1 text-sm font-medium transition-colors',
              transparent
                ? 'text-white/80 hover:text-white'
                : 'text-gray-600 hover:text-navy-950'
            )}>
              Programs
              <ChevronDown className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                programsOpen && 'rotate-180'
              )} />
            </button>
            {programsOpen && (
              <div className="absolute left-0 top-full pt-2 w-72">
                <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 py-2 overflow-hidden">
                  {PROGRAMS.map((p) => (
                    <Link
                      key={p.label}
                      href={p.href}
                      className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
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
        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+12252846854"
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              transparent ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-brand-600'
            )}
          >
            <Phone className="h-3.5 w-3.5" />
            (225) 284-6854
          </a>
          <Link
            href="/book"
            className={cn(
              'rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-all hover:shadow-md hover:-translate-y-px',
              transparent
                ? 'bg-white text-navy-950 hover:bg-white/90'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            )}
          >
            Book Free Consult
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className={cn(
            'md:hidden p-2 rounded-xl transition-colors',
            transparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
          )}
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
          open ? 'max-h-[540px]' : 'max-h-0'
        )}
      >
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-0.5">
          {[
            { href: '/buy', label: 'Buy a Home' },
            { href: '/sell-your-home', label: 'Sell My Home' },
            { href: '/relocate', label: 'Relocate' },
            { href: '/neighborhood/downtown-baton-rouge', label: 'Neighborhoods' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy-950 transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-4 pb-2">Free Tools</p>
            {TOOLS.map((p) => (
              <Link key={p.label} href={p.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}>
                <span className="font-medium">{p.label}</span>
                {p.badge && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{p.badge}</span>}
              </Link>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-4 pb-2">Programs</p>
            {PROGRAMS.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="font-medium">{p.label}</span>
                {p.badge && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {p.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-2.5 px-1">
            <a href="tel:+12252846854" className="flex items-center gap-2 text-sm text-gray-600 px-3">
              <Phone className="h-4 w-4" />
              (225) 284-6854
            </a>
            <Link
              href="/book"
              className="btn-primary text-center text-sm"
              onClick={() => setOpen(false)}
            >
              Book Free Consult
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
