'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { trackLeadSubmit } from '@/components/layout/PixelScripts';
import { getAttribution } from '@/lib/attribution';

const schema = z.object({
  address: z.string().min(5, 'Please enter a valid address'),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  sqft: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'needs-work']).optional(),
  timelineToSell: z.enum(['0-3m', '3-6m', '6-12m', '12m+', 'just-curious']).default('just-curious'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  consentEmail: z.boolean().default(true),
  consentSms: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export function ValuationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { consentEmail: true } });

  async function onSubmit(data: FormData) {
    setSubmitError(null);
    const attribution = getAttribution();

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          intent: 'seller',
          areasOfInterest: data.address,
          timeline: data.timelineToSell === 'just-curious' ? '12m+' : data.timelineToSell,
          financingStatus: 'unknown',
          message: `Address: ${data.address}. Bedrooms: ${data.bedrooms ?? 'N/A'}. Bathrooms: ${data.bathrooms ?? 'N/A'}. Sqft: ${data.sqft ?? 'N/A'}. Condition: ${data.condition ?? 'N/A'}.`,
          consentEmail: data.consentEmail,
          consentSms: data.consentSms,
          source: 'form',
          ...attribution,
        }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      trackLeadSubmit('seller');
      setSubmitted(true);
    } catch (err) {
      console.error('[ValuationForm] Submit failed:', err);
      setSubmitError(
        'We couldn\'t submit your request. Please try again, or call (225) 284-6854.'
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle className="h-14 w-14 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request received!</h3>
        <p className="text-gray-600 max-w-sm">
          One of our market experts will prepare your personalized home valuation and be in touch within 24 hours.
        </p>
        <a href="/book" className="btn-primary mt-6">Book a Free Listing Consultation</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Property info */}
      <div>
        <label className="label">Property Address *</label>
        <input {...register('address')} className="input-field" placeholder="123 Main St, City, State" />
        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Beds</label>
          <select {...register('bedrooms')} className="input-field">
            <option value="">Any</option>
            {['1', '2', '3', '4', '5+'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Baths</label>
          <select {...register('bathrooms')} className="input-field">
            <option value="">Any</option>
            {['1', '1.5', '2', '2.5', '3', '3+'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sq Ft</label>
          <input {...register('sqft')} className="input-field" placeholder="e.g. 2,000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Property Condition</label>
          <select {...register('condition')} className="input-field">
            <option value="">Select</option>
            <option value="excellent">Excellent / Move-in ready</option>
            <option value="good">Good</option>
            <option value="fair">Fair / Some updates needed</option>
            <option value="needs-work">Needs significant work</option>
          </select>
        </div>
        <div>
          <label className="label">Timeline to Sell</label>
          <select {...register('timelineToSell')} className="input-field">
            <option value="just-curious">Just curious</option>
            <option value="0-3m">Within 3 months</option>
            <option value="3-6m">3–6 months</option>
            <option value="6-12m">6–12 months</option>
            <option value="12m+">12+ months</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" />
          Where should we send your valuation?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name *</label>
            <input {...register('firstName')} className="input-field" placeholder="Jane" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input {...register('lastName')} className="input-field" placeholder="Smith" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email *</label>
            <input {...register('email')} type="email" className="input-field" placeholder="jane@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Phone *</label>
            <input {...register('phone')} type="tel" className="input-field" placeholder="(555) 000-0000" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input {...register('consentEmail')} type="checkbox" className="mt-0.5" />
          <span>I agree to receive email communications from SMRG Real Estate.</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input {...register('consentSms')} type="checkbox" className="mt-0.5" />
          <span>I agree to receive SMS updates. Reply STOP to opt out.</span>
        </label>
      </div>

      {submitError && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Get My Free Home Valuation
      </button>
      <p className="text-center text-xs text-gray-400">No obligation. Equal opportunity housing provider.</p>
    </form>
  );
}
