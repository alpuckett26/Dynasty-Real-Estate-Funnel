import { NextRequest, NextResponse } from 'next/server';
import { findContactByEmailOrPhone, updateContact } from '@/lib/hubspot/client';

export async function POST(req: NextRequest) {
  const { email, creditScore, savings, debts, notes } = await req.json();
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'not configured' }, { status: 500 });

  const contactId = await findContactByEmailOrPhone(email);
  if (!contactId) return NextResponse.json({ error: 'contact not found' }, { status: 404 });

  await updateContact(contactId, {
    ...(creditScore && { credit_score_current: String(creditScore) }),
    ...(savings !== undefined && { credit_path_savings: String(savings) }),
    ...(debts !== undefined && { credit_path_debts: String(debts) }),
    ...(notes && { credit_path_notes: notes }),
    credit_path_checkin_date: new Date().toISOString(),
    last_meaningful_interaction: new Date().toISOString(),
  } as never);

  return NextResponse.json({ ok: true });
}
