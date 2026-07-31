'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { trackLeadSubmit } from '@/components/layout/PixelScripts';
import { getAttribution } from '@/lib/attribution';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required').or(z.literal('')),
  phone: z.string().min(10, 'Valid phone required').or(z.literal('')),
  intent: z.enum(['buyer', 'seller', 'both', 'unknown']).default('unknown'),
  areasOfInterest: z.string().optional(),
  timeline: z.enum(['0-3m', '3-6m', '6-12m', '12m+', 'unknown']).default('unknown'),
  financingStatus: z.enum(['pre-approved', 'not-yet', 'cash', 'unknown']).default('unknown'),
  message: z.string().max(2000).optional(),
  consentSms: z.boolean().default(false),
  consentEmail: z.boolean().default(true),
}).refine((d) => d.email || d.phone, {
  message: 'Please provide at least an email or phone number.',
  path: ['email'],
});

type FormData = z.infer<typeof schema>;

interface LeadFormProps {
  source?: string;
  intent?: 'buyer' | 'seller' | 'both' | 'unknown';
  heading?: string;
  subheading?: string;
  showTimeline?: boolean;
  showFinancing?: boolean;
  showMessage?: boolean;
  ctaLabel?: string;
  className?: string;
}

export function LeadForm({
  source = 'form',
  intent,
  heading = 'Get Started Today',
  subheading = "Fill out the form and we'll be in touch shortly.",
  showTimeline = true,
  showFinancing = false,
  showMessage = false,
  ctaLabel = 'Send My Info',
  className,
}: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { intent: intent ?? 'unknown', consentEmail: true },
  });

  async function onSubmit(data: FormData) {
    const utmParams = getUtmParams();
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, source, ...utmParams }),
    });

    const json = await res.json();
    if (res.ok) {
      trackLeadSubmit(data.intent);
      setSuccessMsg(json.message ?? "Thanks! We'll be in touch soon.");
      setSubmitted(true);
    } else {
      alert(json.error ?? 'Something went wrong. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re all set!</h3>
        <p className="text-gray-600 max-w-sm">{successMsg}</p>
        <a href="/book" className="btn-primary mt-6">
          Book a Free Consultation
        </a>
      </div>
    );
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
        {/* Name row */}
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

        {/* Contact */}
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input-field" placeholder="jane@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} type="tel" className="input-field" placeholder="(555) 000-0000" />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* Intent */}
        {!intent && (
          <div>
            <label className="label">I&apos;m looking to…</label>
            <select {...register('intent')} className="input-field">
              <option value="unknown">Select one</option>
              <option value="buyer">Buy a home</option>
              <option value="seller">Sell my home</option>
              <option value="both">Buy and sell</option>
            </select>
          </div>
        )}

        {/* Areas */}
        <div>
          <label className="label">Area(s) of Interest</label>
          <input {...register('areasOfInterest')} className="input-field" placeholder="Downtown, Midtown, Suburbs..." />
        </div>

        {/* Timeline */}
        {showTimeline && (
          <div>
            <label className="label">Timeline</label>
            <select {...register('timeline')} className="input-field">
              <option value="unknown">Select timeline</option>
              <option value="0-3m">Within 3 months</option>
              <option value="3-6m">3–6 months</option>
              <option value="6-12m">6–12 months</option>
              <option value="12m+">12+ months</option>
            </select>
          </div>
        )}

        {/* Financing */}
        {showFinancing && (
          <div>
            <label className="label">Financing Status</label>
            <select {...register('financingStatus')} className="input-field">
              <option value="unknown">Select status</option>
              <option value="pre-approved">Pre-approved</option>
              <option value="cash">Paying cash</option>
              <option value="not-yet">Not yet started</option>
            </select>
          </div>
        )}

        {/* Message */}
        {showMessage && (
          <div>
            <label className="label">Message (optional)</label>
            <textarea
              {...register('message')}
              rows={3}
              className="input-field resize-none"
              placeholder="Tell us about your goals..."
            />
          </div>
        )}

        {/* Consent */}
        <div className="space-y-2 pt-1">
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input {...register('consentEmail')} type="checkbox" className="mt-0.5" />
            <span>I agree to receive email communications from Dynasty Real Estate.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input {...register('consentSms')} type="checkbox" className="mt-0.5" />
            <span>I agree to receive SMS text messages from Dynasty Real Estate. Message &amp; data rates may apply. Reply STOP to opt out.</span>
          </label>
        </div>

        {/* Hidden UTM fields auto-populated by JS */}
        <input type="hidden" id="utm_source_field" />
        <input type="hidden" id="utm_medium_field" />
        <input type="hidden" id="utm_campaign_field" />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {ctaLabel}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your information is secure and never sold. Equal opportunity housing provider.
        </p>
      </form>
    </div>
  );
}

function getUtmParams() {
  return getAttribution();
}
