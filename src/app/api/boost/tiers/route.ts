import { NextResponse } from 'next/server';

const BOOST_TIERS = [
  { tier: 'basic', price: 1500, currency: 'NGN', durationDays: 3 },
  { tier: 'standard', price: 3000, currency: 'NGN', durationDays: 7 },
  { tier: 'premium', price: 6000, currency: 'NGN', durationDays: 14 },
] as const;

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(BOOST_TIERS);
}
