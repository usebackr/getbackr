import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { bankAccounts } from '@/db/schema/bankAccounts';
import { projectWallets } from '@/db/schema/projectWallets';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;
    const { searchParams } = new URL(req.url);
    const selectedCampaignId = searchParams.get('campaignId');

    // Calculate Total Raised & Total Fees from contributions safely
    const contribQuery = db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
        totalPlatformFee: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
      })
      .from(contributions);

    if (selectedCampaignId) {
       contribQuery.where(
         and(
           eq(contributions.campaignId, selectedCampaignId),
           eq(contributions.status, 'confirmed')
         )
       );
    } else {
       contribQuery
         .innerJoin(campaigns, eq(campaigns.id, contributions.campaignId))
         .where(
           and(
             eq(campaigns.creatorId, userId),
             eq(contributions.status, 'confirmed')
           )
         );
    }

    const [contribStats] = await contribQuery;

    const totalRaised = Number(contribStats?.totalAmount || 0);
    const totalFees = Number(contribStats?.totalPlatformFee || 0);
    const netEarning = totalRaised - totalFees;

    // Calculate Total Withdrawn accurately based on non-failed withdrawals
    const withdrawalQuery = db
      .select({
        totalWithdrawn: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)::numeric`,
      })
      .from(withdrawals);

    if (selectedCampaignId) {
        // Need to find the walletId for the selected campaign
        const [wallet] = await db.select({ id: projectWallets.id }).from(projectWallets).where(eq(projectWallets.campaignId, selectedCampaignId)).limit(1);
        if (wallet) {
            withdrawalQuery.where(
                and(
                    eq(withdrawals.walletId, wallet.id),
                    inArray(withdrawals.status, ['processing', 'completed', 'pending_otp'])
                )
            );
        } else {
            // No wallet, no withdrawals possible
            withdrawalQuery.where(sql`1=0`); 
        }
    } else {
        withdrawalQuery.where(
            and(
              eq(withdrawals.creatorId, userId),
              inArray(withdrawals.status, ['processing', 'completed', 'pending_otp']),
            ),
        );
    }

    const [withdrawalStats] = await withdrawalQuery;

    const totalWithdrawn = Number(withdrawalStats?.totalWithdrawn || 0);

    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
      })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    const availableBalance = Math.max(0, netEarning - totalWithdrawn);

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

    let campaignStatus = 'active';
    if (selectedCampaignId) {
        const [campaign] = await db.select({ status: campaigns.status }).from(campaigns).where(eq(campaigns.id, selectedCampaignId)).limit(1);
        if (campaign) campaignStatus = campaign.status;
    }

    return NextResponse.json({
      totalRaised,
      totalFees,
      netEarning,
      totalWithdrawn,
      availableBalance,
      campaigns: userCampaigns,
      kycStatus: user?.kycStatus || 'pending',
      hasBank: !!bank,
      campaignStatus,
    });
  } catch (error: any) {
    console.error('[wallet-summary API Error]', error);
    return NextResponse.json({ error: 'Server error retrieving wallet summary' }, { status: 500 });
  }
}
