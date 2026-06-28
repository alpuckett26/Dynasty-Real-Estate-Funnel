import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleChatTurn, createSession } from '@/lib/agents/supervisor';
import { isOptOutMessage } from '@/lib/utils/compliance';
import { getSession, setSession } from '@/lib/utils/session-store';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = ChatRequestSchema.parse(body);

    if (isOptOutMessage(message)) {
      return NextResponse.json({
        reply:
          "You've been unsubscribed. We won't contact you further. If this was a mistake, just say 'subscribe' or visit our site.",
        sessionId,
        optedOut: true,
      });
    }

    const state = (sessionId ? await getSession(sessionId) : null) ?? createSession();

    const { state: nextState, reply, bookingPrompt } = await handleChatTurn(state, message);
    await setSession(nextState.sessionId, nextState);

    return NextResponse.json({
      reply,
      sessionId: nextState.sessionId,
      bookingPrompt,
      humanHandoffRequired: nextState.humanHandoffRequired,
      handoffReason: nextState.handoffReason,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
    }
    console.error('[ChatAPI]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
