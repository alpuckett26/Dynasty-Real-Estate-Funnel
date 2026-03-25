'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required').or(z.literal('')),
  phone: z.string().min(10, 'Valid phone required').or(z.literal('')),
  workingWithAgent: z.enum(['yes', 'no', 'not-sure']).default('not-sure'),
  timeline: z.enum(['0-3m', '3-6m', '6-12m', '12m+', 'unknown']).default('unknown'),
  consentEmail: z.boolean().default(true),
  consentSms: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface OpenHouseSignInProps {
  eventId: string;
  propertyAddress?: string;
}

export function OpenHouseSignIn({ eventId, propertyAddress }: OpenHouseSignInProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { consentEmail: true },
  });

  async function onSubmit(data: FormData) {
    await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'open_house',
        ...data,
        eventId,
        propertyAddress,
      }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-16 text-center px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">Welcome!</h2>
        <p className="text-gray-600">
          Thanks for visiting. Our team will follow up with more details about this property.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First Name *</label>
          <input {...register('firstName')} className="input-field" />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input {...register('lastName')} className="input-field" />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input {...register('email')} type="email" className="input-field" placeholder="your@email.com" />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label">Phone</label>
        <input {...register('phone')} type="tel" className="input-field" placeholder="(555) 000-0000" />
      </div>
      <div>
        <label className="label">Are you currently working with an agent?</label>
        <select {...register('workingWithAgent')} className="input-field">
          <option value="not-sure">Not sure</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <div>
        <label className="label">When are you looking to move?</label>
        <select {...register('timeline')} className="input-field">
          <option value="unknown">Select timeline</option>
          <option value="0-3m">Within 3 months</option>
          <option value="3-6m">3–6 months</option>
          <option value="6-12m">6–12 months</option>
          <option value="12m+">12+ months</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input {...register('consentEmail')} type="checkbox" className="mt-0.5" />
          <span>I agree to receive email follow-up about this property and related listings.</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
          <input {...register('consentSms')} type="checkbox" className="mt-0.5" />
          <span>I agree to receive SMS updates. Reply STOP to opt out.</span>
        </label>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Sign In
      </button>
    </form>
  );
}
