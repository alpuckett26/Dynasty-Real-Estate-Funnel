import { NextRequest, NextResponse } from 'next/server';
import { findContactByEmailOrPhone } from '@/lib/hubspot/client';
import { Client } from '@hubspot/api-client';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'not configured' }, { status: 500 });

  const contactId = await findContactByEmailOrPhone(email);
  if (!contactId) return NextResponse.json({ found: false });

  const client = new Client({ accessToken: token });
  const contact = await client.crm.contacts.basicApi.getById(contactId, [
    'firstname', 'lastname',
    'credit_score_current', 'credit_score_goal',
    'credit_path_savings', 'credit_path_savings_goal',
    'credit_path_debts',
    'credit_path_checkin_date',
    'credit_path_notes',
    'credit_path_enrolled_date',
    'needs_credit_repair',
  ]);

  return NextResponse.json({
    found: true,
    contactId,
    firstName: contact.properties.firstname,
    lastName: contact.properties.lastname,
    creditScore: contact.properties.credit_score_current ? Number(contact.properties.credit_score_current) : null,
    creditScoreGoal: contact.properties.credit_score_goal ? Number(contact.properties.credit_score_goal) : 640,
    savings: contact.properties.credit_path_savings ? Number(contact.properties.credit_path_savings) : null,
    savingsGoal: contact.properties.credit_path_savings_goal ? Number(contact.properties.credit_path_savings_goal) : 10000,
    debts: contact.properties.credit_path_debts ? Number(contact.properties.credit_path_debts) : null,
    lastCheckin: contact.properties.credit_path_checkin_date,
    notes: contact.properties.credit_path_notes,
    enrolledDate: contact.properties.credit_path_enrolled_date,
  });
}
