import { NextRequest, NextResponse } from 'next/server';
import { updateContact } from '@/lib/hubspot/client';

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { contactId, action, value } = await req.json();
  if (!contactId || !action) return NextResponse.json({ error: 'contactId and action required' }, { status: 400 });

  try {
    if (action === 'update_consultation') {
      await updateContact(contactId, { consultation_status: value } as never);
    }
    if (action === 'mark_contacted') {
      await updateContact(contactId, { last_meaningful_interaction: new Date().toISOString() } as never);
    }
    if (action === 'update_route') {
      await updateContact(contactId, { lead_route: value } as never);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ActionsAPI]', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
