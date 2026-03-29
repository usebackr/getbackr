import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { users } from '@/db/schema/users';
import { spendingLogs } from '@/db/schema/spendingLogs';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const { amount, campaignId, reason } = await req.json();
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!campaignId || !reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'A campaign and a valid reason must be provided for transparency.' },
        { status: 400 },
      );
    }

    // 1. Verify KYC securely before allowing payout dispatch
    const [userRecord] = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!userRecord || userRecord.kycStatus !== 'verified') {
      return NextResponse.json(
        { error: 'You must complete KYC verification before withdrawing funds.' },
        { status: 403 },
      );
    }

    // Atomic transaction for accurate live evaluation
    return await db.transaction(async (tx) => {
      // 1. Fetch wallet associated with this specific campaign
      const [campaignWallet] = await tx
        .select({ walletId: projectWallets.id })
        .from(projectWallets)
        .innerJoin(campaigns, eq(campaigns.id, projectWallets.campaignId))
        .where(and(eq(campaigns.creatorId, userId), eq(campaigns.id, campaignId)))
        .limit(1);

      if (!campaignWallet) {
        return NextResponse.json(
          { error: 'Invalid campaign selected or no wallet configured.' },
          { status: 400 },
        );
      }

      // 2. Evaluate project-specific balance
      const [contribStats] = await tx
        .select({
          totalAmount: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
          totalPlatformFee: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
        })
        .from(contributions)
        .where(and(eq(contributions.campaignId, campaignId), eq(contributions.status, 'confirmed')));

      const projectRaised = Number(contribStats?.totalAmount || 0);
      const projectFees = Number(contribStats?.totalPlatformFee || 0);

      const [withdrawalStats] = await tx
        .select({
          totalWithdrawn: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)::numeric`,
        })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.walletId, campaignWallet.walletId),
            inArray(withdrawals.status, ['processing', 'completed', 'pending_otp']),
          ),
        );

      const projectWithdrawn = Number(withdrawalStats?.totalWithdrawn || 0);
      const availableBalance = Math.max(0, projectRaised - projectFees - projectWithdrawn);

      // 3. Precise Validations
      if (projectRaised === 0 || availableBalance <= 0) {
        return NextResponse.json({ error: 'This project wallet is currently empty.' }, { status: 400 });
      }

      if (withdrawAmount > availableBalance) {
        return NextResponse.json({ 
          error: `Insufficient funds in this project's wallet. (Available: ₦${availableBalance.toLocaleString()})` 
        }, { status: 400 });
      }

      // 4. Securely record the withdrawal request
      await tx.insert(withdrawals).values({
        walletId: campaignWallet.walletId,
        creatorId: userId,
        amount: withdrawAmount.toString(),
        status: 'processing', // MVP state machine bypass
      });

      // 4. Inject into Transparency Ledger (spendingLogs)
      await tx.insert(spendingLogs).values({
        campaignId,
        description: reason,
        amount: withdrawAmount.toString(),
        entryDate: new Date().toISOString().split('T')[0],
      });

      return NextResponse.json({
        message: 'Withdrawal initiated & transparency log created successfully',
        amount: withdrawAmount,
      });
    });
  } catch (error: any) {
    console.error('[withdraw API Error]', error);
    return NextResponse.json({ error: 'Server error processing withdrawal' }, { status: 500 });
  }
}
