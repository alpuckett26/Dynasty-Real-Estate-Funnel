import Link from 'next/link';
import { Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { BROKERAGE_NAME } from '@/lib/site';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold font-serif">
                A
              </div>
              <div className="leading-none">
                <p className="font-serif text-lg font-bold text-white tracking-tight">Adreanne</p>
                <p className="text-xs font-medium text-brand-400 -mt-0.5">The Realtor</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
              Baton Rouge&apos;s trusted real estate agent. Specializing in first-time buyers,
              healthcare workers, and families putting down roots in Louisiana.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-gray-400 hover:bg-brand-600 hover:text-white transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-gray-400 hover:bg-brand-600 hover:text-white transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Services</p>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/buy', label: 'Buy a Home' },
                { href: '/sell-your-home', label: 'Sell Your Home' },
                { href: '/relocate', label: 'Relocation Services' },
                { href: '/book', label: 'Book a Consultation' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6 mb-4">Programs</p>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/register', label: 'First-Time Homebuyer' },
                { href: '/register', label: 'Healthcare Worker Perks' },
                { href: '/get-ready', label: 'Credit Repair Path' },
                { href: '/sell-your-home', label: 'Free Home Valuation' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Contact</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+12252846854" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0 text-brand-500" />
                  (225) 284-6854
                </a>
              </li>
              <li>
                <a href="mailto:adreanne@adreannetherealtor.com" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0 text-brand-500" />
                  adreanne@adreannetherealtor.com
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <Link
                href="/book"
                className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Book Free Consult
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-navy-800">
          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
            Adreanne Aranha, REALTOR® — licensed in Louisiana, brokered by {BROKERAGE_NAME}.
            Equal Housing Opportunity. We do not discriminate on the basis of race, color, religion,
            national origin, sex, disability, or familial status.
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} Adreanne The Realtor. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Agent Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
