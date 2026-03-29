import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { bankAccounts } from '@/db/schema/bankAccounts';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    // Calculate Total Raised & Total Fees from contributions safely based on verified payments
    const [contribStats] = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
        totalPlatformFee: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
      })
      .from(contributions)
      .innerJoin(campaigns, eq(campaigns.id, contributions.campaignId))
      .where(and(eq(campaigns.creatorId, userId), eq(contributions.status, 'confirmed')));

    const totalRaised = Number(contribStats?.totalAmount || 0);
    const totalFees = Number(contribStats?.totalPlatformFee || 0);

    // Calculate Total Withdrawn accurately based on non-failed withdrawals
    const [withdrawalStats] = await db
      .select({
        totalWithdrawn: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)::numeric`,
      })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.creatorId, userId),
          inArray(withdrawals.status, ['processing', 'completed', 'pending_otp']),
        ),
      );

    const totalWithdrawn = Number(withdrawalStats?.totalWithdrawn || 0);

    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    const calcAvailable = totalRaised - totalFees - totalWithdrawn;
    const availableBalance = calcAvailable > 0 ? calcAvailable : 0;

    const [user] = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [bank] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .limit(1);

    return NextResponse.json({
      totalRaised,
      totalFees,
      totalWithdrawn,
      availableBalance,
      campaigns: userCampaigns,
      kycStatus: user?.kycStatus || 'pending',
      hasBank: !!bank,
    });
  } catch (error: any) {
    console.error('[wallet-summary API Error]', error);
    return NextResponse.json({ error: 'Server error retrieving wallet summary' }, { status: 500 });
  }
}
