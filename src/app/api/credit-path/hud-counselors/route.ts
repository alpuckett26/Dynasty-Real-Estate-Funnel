import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 86400; // cache 24 hours

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip') || '70801'; // default Baton Rouge

  try {
    const res = await fetch(
      `https://services.hud.gov/resources/apps/hudapi/public/homeowner?zipcode=${zip}&type=9`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error('HUD API error');
    const data = await res.json();
    // Return first 5 results
    const counselors = (data || []).slice(0, 5).map((c: Record<string, string>) => ({
      name: c.nme,
      address: `${c.adr1}, ${c.cty}, ${c.sta} ${c.zip}`,
      phone: c.phone1,
      website: c.weburl,
      languages: c.languages,
    }));
    return NextResponse.json({ counselors });
  } catch {
    // Fallback if HUD API is down
    return NextResponse.json({
      counselors: [],
      fallbackUrl: `https://www.hud.gov/counseling?zipcode=${zip}`,
    });
  }
}
