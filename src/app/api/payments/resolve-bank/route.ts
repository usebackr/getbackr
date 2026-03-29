import { NextRequest, NextResponse } from 'next/server';
import { resolveAccountNumber } from '@/lib/payments/paystack';

export async function POST(req: NextRequest) {
  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json({ error: 'Missing account number or bank code' }, { status: 400 });
    }

    if (accountNumber.length < 10) {
      return NextResponse.json({ error: 'Account number too short' }, { status: 400 });
    }

    const accountName = await resolveAccountNumber(accountNumber, bankCode);
    return NextResponse.json({ accountName });
  } catch (err: any) {
    console.error('[Bank Resolve API] Failure:', {
      message: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ error: err.message || 'Error resolving account' }, { status: 500 });
  }
}
