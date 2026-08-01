'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { trackLeadSubmit } from '@/components/layout/PixelScripts';
import { getAttribution } from '@/lib/attribution';

const schema = z
  .object({
    // Contact
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email required').or(z.literal('')),
    phone: z.string().min(10, 'Valid phone required').or(z.literal('')),
    contactPreference: z.enum(['call', 'text', 'email']).default('call'),

    // Intent
    intent: z.enum(['buyer', 'seller', 'both', 'unknown']).default('unknown'),
    firstTimeHomebuyer: z.boolean().default(false),
    healthcareWorker: z.boolean().default(false),

    // Location + timeline
    areasOfInterest: z.string().optional(),
    timeline: z.enum(['now', '30-60d', '3-6m', '6m+', 'researching']).default('researching'),

    // Financial readiness
    financingStatus: z
      .enum(['pre-approved', 'need-lender', 'need-dpa', 'need-credit-repair', 'unsure'])
      .default('unsure'),

    // Buyer details
    budgetMin: z.coerce.number().optional(),
    budgetMax: z.coerce.number().optional(),
    bedrooms: z.string().optional(),
    leaseExpiration: z.string().optional(),
    needToSellFirst: z.boolean().default(false),

    // Seller details
    needsValuation: z.boolean().default(false),
    alreadyListed: z.boolean().default(false),
    propertyAddress: z.string().optional(),
    buyingAfterSelling: z.boolean().default(false),

    // Consent
    consentSms: z.boolean().default(false),
    consentEmail: z.boolean().default(true),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Please provide at least an email or phone number.',
    path: ['email'],
  });

type FormData = z.infer<typeof schema>;

interface IntakeFormProps {
  source?: string;
  defaultIntent?: 'buyer' | 'seller' | 'both' | 'unknown';
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  className?: string;
  /** Force-show seller fields regardless of intent selection */
  sellerMode?: boolean;
}

export function IntakeForm({
  source = 'intake-form',
  defaultIntent = 'unknown',
  heading = 'Register Now — Free Consultation',
  subheading = 'Takes 2 minutes. We respond within 5 minutes during business hours.',
  ctaLabel = 'Register & Book My Consultation',
  className,
  sellerMode = false,
}: IntakeFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      intent: defaultIntent,
      contactPreference: 'call',
      timeline: 'researching',
      financingStatus: 'unsure',
      consentEmail: true,
    },
  });

  const intent = watch('intent');
  const showSellerFields = sellerMode || intent === 'seller' || intent === 'both';
  const showBuyerFields = !sellerMode || intent === 'buyer' || intent === 'both' || intent === 'unknown';

  async function onSubmit(data: FormData) {
    const utmParams = getUtmParams();
    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source, ...utmParams }),
    });

    if (res.ok) {
      const json = await res.json();
      trackLeadSubmit(data.intent);
      // Redirect to thank-you with name + booking URL
      const params = new URLSearchParams({
        name: data.firstName,
        intent: data.intent,
        route: json.route ?? 'warm',
      });
      window.location.href = `/thank-you?${params.toString()}`;
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className={cn('card', className)}>
      {heading && (
        <div className="mb-6">
          <h3 className="text-xl font-serif font-bold text-navy-900">{heading}</h3>
          {subheading && <p className="mt-1 text-sm text-gray-500">{subheading}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <>
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name *</label>
                <input {...register('firstName')} className="input-field" placeholder="Jane" />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input {...register('lastName')} className="input-field" placeholder="Smith" />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="jane@example.com" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} type="tel" className="input-field" placeholder="(555) 000-0000" />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            {/* Contact preference */}
            <div>
              <label className="label">Best way to reach you</label>
              <div className="grid grid-cols-3 gap-2">
                {(['call', 'text', 'email'] as const).map((opt) => (
                  <label key={opt} className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 transition-colors">
                    <input {...register('contactPreference')} type="radio" value={opt} className="sr-only" />
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Intent */}
            <div>
              <label className="label">I&apos;m looking to…</label>
              <select {...register('intent')} className="input-field">
                <option value="unknown">Select one</option>
                <option value="buyer">Buy a home</option>
                <option value="seller">Sell my home</option>
                <option value="both">Buy and sell</option>
              </select>
            </div>

            {/* Programs */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Special Programs</p>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input {...register('firstTimeHomebuyer')} type="checkbox" className="rounded" />
                I&apos;m a first-time homebuyer
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input {...register('healthcareWorker')} type="checkbox" className="rounded" />
                I&apos;m a healthcare worker
              </label>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary w-full"
            >
              Next: Tell Us More →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-brand-600 hover:underline mb-2 flex items-center gap-1"
            >
              ← Back
            </button>

            {/* Location */}
            <div>
              <label className="label">What city/state are you interested in?</label>
              <input {...register('areasOfInterest')} className="input-field" placeholder="e.g. Atlanta, GA — Downtown, Midtown" />
            </div>

            {/* Timeline */}
            <div>
              <label className="label">When are you looking to move?</label>
              <select {...register('timeline')} className="input-field">
                <option value="now">Ready now</option>
                <option value="30-60d">30–60 days</option>
                <option value="3-6m">3–6 months</option>
                <option value="6m+">6+ months</option>
                <option value="researching">Just researching</option>
              </select>
            </div>

            {/* Financial readiness */}
            {showBuyerFields && (
              <div>
                <label className="label">Financial readiness</label>
                <select {...register('financingStatus')} className="input-field">
                  <option value="pre-approved">Already pre-approved</option>
                  <option value="need-lender">Need a lender referral</option>
                  <option value="need-dpa">Need down payment assistance info</option>
                  <option value="need-credit-repair">Need credit repair</option>
                  <option value="unsure">Unsure / just starting</option>
                </select>
              </div>
            )}

            {/* Buyer fields */}
            {showBuyerFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Min Budget</label>
                    <input {...register('budgetMin')} type="number" className="input-field" placeholder="$200,000" />
                  </div>
                  <div>
                    <label className="label">Max Budget</label>
                    <input {...register('budgetMax')} type="number" className="input-field" placeholder="$400,000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Bedrooms needed</label>
                    <select {...register('bedrooms')} className="input-field">
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Lease expiration</label>
                    <input {...register('leaseExpiration')} className="input-field" placeholder="Month/Year" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input {...register('needToSellFirst')} type="checkbox" className="rounded" />
                  I need to sell my current home first
                </label>
              </>
            )}

            {/* Seller fields */}
            {showSellerFields && (
              <>
                <div className="border-t pt-4 mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Seller Details</p>
                  <div>
                    <label className="label">Property address (optional)</label>
                    <input {...register('propertyAddress')} className="input-field" placeholder="123 Main St, City, ST" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input {...register('needsValuation')} type="checkbox" className="rounded" />
                      I&apos;d like a free home valuation
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input {...register('alreadyListed')} type="checkbox" className="rounded" />
                      My home is already listed
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input {...register('buyingAfterSelling')} type="checkbox" className="rounded" />
                      I plan to buy again after selling
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Consent */}
            <div className="space-y-2 pt-1 border-t">
              <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                <input {...register('consentEmail')} type="checkbox" className="mt-0.5 rounded" />
                <span>I agree to receive email communications from SMRG Real Estate.</span>
              </label>
              <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                <input {...register('consentSms')} type="checkbox" className="mt-0.5 rounded" />
                <span>I agree to receive SMS messages. Message &amp; data rates may apply. Reply STOP to opt out.</span>
              </label>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {ctaLabel}
            </button>

            <p className="text-center text-xs text-gray-400">
              Your information is secure and never sold. Equal opportunity housing provider.
            </p>
          </>
        )}
      </form>
    </div>
  );
}

function getUtmParams() {
  return getAttribution();
}
