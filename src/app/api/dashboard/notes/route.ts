import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const contactId = req.nextUrl.searchParams.get('contactId');
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });

  const client = new Client({ accessToken: token });

  try {
    // Get note IDs associated with this contact
    const assocResult = await client.crm.associations.batchApi.read(
      'contacts',
      'notes',
      { inputs: [{ id: contactId }] }
    );

    const assocResults = ((assocResult as unknown as Record<string, unknown>)?.results ?? []) as Array<{to?: Array<{id: string}>}>;
    const noteIds: string[] = assocResults.flatMap((r) => (r.to ?? []).map((t) => t.id));

    if (noteIds.length === 0) {
      return NextResponse.json({ notes: [] });
    }

    const batchResult = await client.crm.objects.notes.batchApi.read({
      inputs: noteIds.map((id) => ({ id })),
      properties: ['hs_note_body', 'hs_timestamp'],
      propertiesWithHistory: [],
    });

    const notes = batchResult.results
      .map((n) => ({
        id: n.id,
        body: n.properties.hs_note_body ?? '',
        timestamp: n.properties.hs_timestamp,
      }))
      .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());

    return NextResponse.json({ notes });
  } catch (err) {
    console.error('[NotesAPI]', err);
    return NextResponse.json({ notes: [] });
  }
}

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { contactId, body } = await req.json();
  if (!contactId || !body) return NextResponse.json({ error: 'contactId and body required' }, { status: 400 });

  const client = new Client({ accessToken: token });

  try {
    const result = await client.crm.objects.notes.basicApi.create({
      properties: {
        hs_note_body: body,
        hs_timestamp: String(Date.now()),
      },
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED' as never, associationTypeId: 202 }],
      }],
    });
    return NextResponse.json({ id: result.id });
  } catch (err) {
    console.error('[NotesAPI POST]', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
