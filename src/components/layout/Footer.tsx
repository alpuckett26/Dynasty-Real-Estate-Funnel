import Link from 'next/link';
import { Phone, Mail, Instagram, Facebook } from 'lucide-react';

const FAIR_HOUSING_NOTICE =
  'Dynasty Real Estate is an equal opportunity housing provider. We do not discriminate on the basis of race, color, religion, national origin, sex, disability, or familial status.';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-300">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="font-serif text-2xl font-bold text-white">Dynasty Real Estate</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-400 max-w-sm">
              Helping buyers, sellers, and families navigate the real estate market with expert guidance and cutting-edge technology.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Services</p>
            <ul className="space-y-2.5 text-sm">
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
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/register', label: 'First-Time Homebuyer' },
                { href: '/register', label: 'Healthcare Worker' },
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
                <a href="tel:+15553962789" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  (555) DYN-ASTY
                </a>
              </li>
              <li>
                <a href="mailto:hello@dynastyrealestate.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  hello@dynastyrealestate.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Fair Housing Notice */}
        <div className="mt-12 pt-8 border-t border-navy-800">
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">{FAIR_HOUSING_NOTICE}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Dynasty Real Estate. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
