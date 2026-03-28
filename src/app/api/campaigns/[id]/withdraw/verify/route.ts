import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { withdrawals } from '@/db/schema/withdrawals';
import { projectWallets } from '@/db/schema/projectWallets';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;
  const { id } = params;

  const body = await req.json();
  const { withdrawalId, otp, amount } = body as {
    withdrawalId: string;
    otp: string;
    amount: number;
  };

  if (!withdrawalId || !otp || amount == null) {
    return NextResponse.json(
      { error: 'withdrawalId, otp, and amount are required.' },
      { status: 422 },
    );
  }

  // Verify campaign ownership
  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Find the withdrawal record
  const withdrawal = await db.query.withdrawals.findFirst({
    where: and(eq(withdrawals.id, withdrawalId), eq(withdrawals.creatorId, userId)),
  });
  if (!withdrawal) {
    return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
  }

  // Check OTP expiry
  const now = new Date();
  if (!withdrawal.otpExpiresAt || withdrawal.otpExpiresAt <= now) {
    await db.update(withdrawals).set({ status: 'expired' }).where(eq(withdrawals.id, withdrawalId));
    return NextResponse.json(
      { error: 'OTP expired. Please initiate a new withdrawal.' },
      { status: 410 },
    );
  }

  // Verify OTP hash
  const otpValid =
    withdrawal.otpCodeHash != null && (await bcrypt.compare(otp, withdrawal.otpCodeHash));
  if (!otpValid) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 422 });
  }

  // Optimistic lock: deduct balance atomically
  const result = await db
    .update(projectWallets)
    .set({
      balance: sql`balance - ${amount}`,
      totalWithdrawn: sql`total_withdrawn + ${amount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(projectWallets.campaignId, id), sql`balance >= ${amount}`))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Insufficient balance.' }, { status: 422 });
  }

  // Generate payment reference and mark withdrawal as processing
  const reference = `WD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  await db
    .update(withdrawals)
    .set({ status: 'processing', paymentReference: reference, amount: String(amount) })
    .where(eq(withdrawals.id, withdrawalId));

  return NextResponse.json(
    {
      message: 'Withdrawal initiated. Funds will arrive within 2 business days.',
      reference,
    },
    { status: 200 },
  );
}
