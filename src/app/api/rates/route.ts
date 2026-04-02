import { NextResponse } from 'next/server';
import { getCurrentRates } from '@/lib/rates';

export const revalidate = 21600; // 6 hours

export async function GET() {
  const rates = await getCurrentRates();
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
  });
}
