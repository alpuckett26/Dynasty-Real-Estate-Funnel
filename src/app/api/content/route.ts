import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runContentAgent } from '@/lib/agents/content-agent';

const ContentRequestSchema = z.object({
  type: z.enum(['social', 'email', 'ad']),
  context: z.string().min(10).max(2000),
  tone: z.enum(['professional', 'friendly', 'urgent']).optional(),
  includeListings: z.boolean().optional(),
  targetAudience: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ContentRequestSchema.parse(body);
    const result = await runContentAgent(input);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
    }
    console.error('[ContentAPI]', err);
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}
