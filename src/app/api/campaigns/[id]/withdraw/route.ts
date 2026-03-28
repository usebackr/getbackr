import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { withdrawals } from '@/db/schema/withdrawals';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

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

  // Fetch campaign and verify ownership
  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch creator and check KYC
  const creator = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!creator) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (creator.kycStatus !== 'verified') {
    return NextResponse.json(
      { error: 'KYC verification required before withdrawing funds.' },
      { status: 403 },
    );
  }

  // Fetch wallet and check balance
  const wallet = await db.query.projectWallets.findFirst({
    where: eq(projectWallets.campaignId, id),
  });
  if (!wallet || parseFloat(wallet.balance) <= 0) {
    return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 422 });
  }

  // Generate 6-digit OTP, hash it, store withdrawal record
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [withdrawal] = await db
    .insert(withdrawals)
    .values({
      walletId: wallet.id,
      creatorId: userId,
      amount: wallet.balance,
      otpCodeHash: otpHash,
      otpExpiresAt,
      status: 'pending_otp',
    })
    .returning();

  // Enqueue OTP delivery job
  const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);
  await queue.add({
    type: 'withdrawal_otp',
    userId,
    email: creator.email,
    otp,
    campaignTitle: campaign.title,
  });

  return NextResponse.json(
    {
      message: 'OTP sent to your registered email. Enter it to confirm withdrawal.',
      withdrawalId: withdrawal.id,
    },
    { status: 200 },
  );
}
