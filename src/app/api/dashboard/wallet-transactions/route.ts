import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import { campaigns } from '@/db/schema/campaigns';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    // Fetch user contributions
    const userContributions = await db
      .select({
        id: contributions.id,
        amount: contributions.amount,
        netAmount: contributions.netAmount,
        platformFee: contributions.platformFee,
        currency: contributions.currency,
        status: contributions.status,
        createdAt: contributions.createdAt,
        type: sql<string>`'contribution'`,
        description: campaigns.title,
      })
      .from(contributions)
      .innerJoin(campaigns, eq(campaigns.id, contributions.campaignId))
      .where(and(eq(campaigns.creatorId, userId), eq(contributions.status, 'confirmed')));

    // Fetch user withdrawals
    const userWithdrawals = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        netAmount: withdrawals.amount,
        platformFee: sql<string>`'0.00'`,
        currency: sql<string>`'NGN'`,
        status: withdrawals.status,
        createdAt: withdrawals.createdAt,
        type: sql<string>`'withdrawal'`,
        description: sql<string>`'Payout'`,
      })
      .from(withdrawals)
      .where(eq(withdrawals.creatorId, userId));

    const merged = [...userContributions, ...userWithdrawals].sort(
      (a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime(),
    );

    return NextResponse.json({ transactions: merged });
  } catch (error: any) {
    console.error('[wallet-transactions API Error]', error);
    return NextResponse.json({ error: 'Server error retrieving transactions' }, { status: 500 });
  }
}
