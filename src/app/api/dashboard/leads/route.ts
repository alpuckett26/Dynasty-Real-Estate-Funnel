import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  // Simple password protection
  const auth = req.headers.get('x-dashboard-key');
  const key = process.env.DASHBOARD_KEY;
  if (key && auth !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new Client({ accessToken: token });

  try {
    const result = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: 'channel_source', operator: 'HAS_PROPERTY' as never },
          ],
        },
      ],
      properties: [
        'firstname', 'lastname', 'email', 'phone',
        'lead_type', 'lead_route', 'total_lead_score',
        'timeline', 'financing_status', 'program_type',
        'consultation_status', 'channel_source',
        'first_time_homebuyer', 'healthcare_worker',
        'createdate', 'last_meaningful_interaction',
        'areas_of_interest', 'needs_credit_repair',
      ],
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' } as never],
      limit: 100,
      after: '0',
    });

    const leads = result.results.map((c) => ({
      id: c.id,
      name: `${c.properties.firstname ?? ''} ${c.properties.lastname ?? ''}`.trim(),
      email: c.properties.email,
      phone: c.properties.phone,
      route: c.properties.lead_route,
      score: c.properties.total_lead_score,
      intent: c.properties.lead_type,
      timeline: c.properties.timeline,
      financing: c.properties.financing_status,
      program: c.properties.program_type,
      consultationStatus: c.properties.consultation_status,
      source: c.properties.channel_source,
      fthb: c.properties.first_time_homebuyer === 'true',
      healthcare: c.properties.healthcare_worker === 'true',
      areasOfInterest: c.properties.areas_of_interest,
      createdAt: c.properties.createdate,
      lastInteraction: c.properties.last_meaningful_interaction,
    }));

    const hot = leads.filter((l) => l.route === 'Hot').length;
    const warm = leads.filter((l) => l.route === 'Warm').length;
    const cold = leads.filter((l) => !l.route || l.route === 'Cold').length;
    const booked = leads.filter((l) => l.consultationStatus === 'Booked').length;

    return NextResponse.json({ leads, stats: { total: leads.length, hot, warm, cold, booked } });
  } catch (err) {
    console.error('[Dashboard]', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
