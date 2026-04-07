import { NextResponse } from 'next/server';
import { getTransferBalance } from '@/lib/payments/paystack';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const balance = await getTransferBalance();
    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('[Balance API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
