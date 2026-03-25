import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runReputationAgent } from '@/lib/agents/reputation-agent';

const ReputationRequestSchema = z.object({
  contactId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  closedPropertyAddress: z.string().optional(),
  agentName: z.string().optional(),
  daysSinceClose: z.number().min(0),
  preferredChannel: z.enum(['email', 'sms', 'dm']),
  consentEmail: z.boolean().default(false),
  consentSms: z.boolean().default(false),
  consentDm: z.boolean().default(false),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ReputationRequestSchema.parse(body);

    const result = await runReputationAgent({
      ...input,
      consent: {
        email: input.consentEmail,
        sms: input.consentSms,
        dm: input.consentDm,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
    }
    console.error('[ReputationAPI]', err);
    return NextResponse.json({ error: 'Message generation failed' }, { status: 500 });
  }
}
