import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { IntakeLeadSchema, processIntakeLead } from '@/lib/intake/process-lead';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = IntakeLeadSchema.parse(body);

    if (!data.email && !data.phone) {
      return NextResponse.json({ error: 'Please provide at least an email or phone number.' }, { status: 400 });
    }

    const result = await processIntakeLead(data);

    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      route: result.route,
      stage: result.stage,
      tags: result.tags,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data', details: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[IntakeAPI] 500:', msg);
    return NextResponse.json({ error: 'Something went wrong. Please try again.', detail: msg }, { status: 500 });
  }
}
