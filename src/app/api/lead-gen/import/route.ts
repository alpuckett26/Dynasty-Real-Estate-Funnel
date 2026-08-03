/**
 * Purchased lead-list import (REDX and compatible CSV exports).
 *
 * POST a CSV body and each row becomes a HubSpot contact with a call task
 * assigned to Adreanne.
 *
 * Deliberately does NOT send SMS or email. These are purchased cold records:
 * the numbers have not opted in, and automated marketing texts to them carry
 * real TCPA exposure. Manual dialling is the defensible way to work this data,
 * so the pipeline hands Adreanne a call task instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseRedxCsv, type RedxLead } from '@/lib/lead-gen/sources/redx';
import { findContactByEmailOrPhone, createContact, createNote, createTask } from '@/lib/hubspot/client';
import { isAuthorizedCron } from '@/lib/utils/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** Purchased lists are outbound prospecting, not an inbound channel. */
const CHANNEL_SOURCE = 'referral';

function buildNote(lead: RedxLead, listLabel: string): string {
  const location = [lead.city, lead.state, lead.zip].filter(Boolean).join(', ');
  return [
    `[PURCHASED LIST — ${listLabel} — ${new Date().toLocaleDateString()}]`,
    lead.propertyAddress ? `Property: ${lead.propertyAddress}` : '',
    location ? `Location: ${location}` : '',
    `Lead type: ${lead.leadType}`,
    lead.phones.length ? `Phones: ${lead.phones.join(', ')}` : '',
    lead.email ? `Email: ${lead.email}` : '',
    '',
    'COLD RECORD — call only. Do not send automated marketing texts to this',
    'number; it has not opted in. Scrub against the National DNC Registry',
    'before dialling unless an existing business relationship applies.',
    Object.keys(lead.extra).length
      ? '\nFrom the export:\n' + Object.entries(lead.extra).map(([k, v]) => `  ${k}: ${v}`).join('\n')
      : '',
  ].filter(Boolean).join('\n');
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listLabel = req.nextUrl.searchParams.get('list') ?? 'REDX';
  const defaultType = req.nextUrl.searchParams.get('type') ?? 'FSBO';
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  const csv = await req.text();
  if (!csv.trim()) {
    return NextResponse.json({ error: 'Empty body — POST the CSV as the request body' }, { status: 400 });
  }

  let leads: RedxLead[];
  try {
    leads = parseRedxCsv(csv, defaultType);
  } catch (err) {
    console.error('[LeadImport] Parse failed:', err);
    return NextResponse.json({ error: 'Could not parse CSV' }, { status: 400 });
  }

  if (!leads.length) {
    return NextResponse.json({
      error: 'No usable rows — every row lacked a phone and an email, or headers were unrecognised.',
      hint: 'Expected columns like: First Name, Last Name, Phone, Email, Property Address, City, State, Zip',
    }, { status: 400 });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      parsed: leads.length,
      sample: leads.slice(0, 3).map((l) => ({
        name: [l.firstName, l.lastName].filter(Boolean).join(' ') || '(no name)',
        phones: l.phones, email: l.email, property: l.propertyAddress, leadType: l.leadType,
      })),
    });
  }

  let created = 0, skipped = 0, errors = 0;

  for (const lead of leads) {
    try {
      const primaryPhone = lead.phones[0];
      const existing = await findContactByEmailOrPhone(lead.email, primaryPhone);
      if (existing) { skipped++; continue; }

      const contactId = await createContact({
        firstname: lead.firstName || 'Unknown',
        lastname: lead.lastName || `${lead.leadType} Lead`,
        email: lead.email,
        phone: primaryPhone,
        lead_type: 'Seller',
        channel_source: CHANNEL_SOURCE,
        lead_route: 'Cold',
        areas_of_interest: [lead.city, lead.state].filter(Boolean).join(', ') || undefined,
        // No consent was given by a purchased record — record that truthfully.
        consent_sms: false,
        consent_email: false,
        last_meaningful_interaction: new Date().toISOString(),
      } as never);

      await createNote(contactId, buildNote(lead, listLabel)).catch(console.error);

      const who = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'owner';
      const where = lead.propertyAddress ? ` — ${lead.propertyAddress}` : '';
      await createTask(contactId, {
        subject: `📞 Call ${lead.leadType}: ${who}${where}`,
        body: `Purchased ${listLabel} record. Call only — no automated texts.\n${lead.phones.join(' / ')}`,
        status: 'NOT_STARTED',
        taskType: 'CALL',
        dueDate: Date.now() + 2 * 60 * 60 * 1000,
      } as never).catch(console.error);

      created++;
    } catch (err) {
      console.error('[LeadImport] Row failed:', err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, list: listLabel, parsed: leads.length, created, skipped, errors });
}
