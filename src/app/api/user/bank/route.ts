import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bankAccounts } from '@/db/schema/bankAccounts';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { resolveAccountNumber } from '@/lib/payments/paystack';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, payload.sub as string));

    // For now, assume 1 bank account per user
    if (accounts.length === 0) {
      return NextResponse.json({ account: null });
    }

    return NextResponse.json({ account: accounts[0] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch bank account' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const { bankName, bankCode, accountNumber } = await req.json();

    if (!bankName || !bankCode || !accountNumber) {
      return NextResponse.json({ error: 'Missing required bank details' }, { status: 400 });
    }

    // Verify again via Paystack before saving to ensure correctness
    const accountName = await resolveAccountNumber(accountNumber, bankCode);

    // Check if user already has an account, then update, else insert
    const existing = await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));

    if (existing.length > 0) {
      await db
        .update(bankAccounts)
        .set({
          bankName,
          bankCode,
          accountNumber,
          accountName,
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.userId, userId));
    } else {
      await db.insert(bankAccounts).values({
        userId,
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });
    }

    return NextResponse.json({ message: 'Bank account saved successfully', accountName });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save bank account' },
      { status: 500 },
    );
  }
}
