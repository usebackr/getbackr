import { NextResponse } from 'next/server';
import { listBanks } from '@/lib/payments/paystack';

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json(banks);
  } catch (err) {
    console.error('[Bank List] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch supported banks.' }, { status: 500 });
  }
}
