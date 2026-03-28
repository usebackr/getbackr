import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { contributions } from '@/db/schema/contributions';
import { users } from '@/db/schema/users';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const wallet = await db.query.projectWallets.findFirst({
    where: eq(projectWallets.campaignId, id),
  });

  const goalAmount = parseFloat(campaign.goalAmount);
  const totalRaised = wallet ? parseFloat(wallet.totalReceived) : 0;
  const fundingProgressPercent =
    goalAmount > 0 ? Math.min(100, (totalRaised / goalAmount) * 100) : 0;

  const endDate = new Date(campaign.endDate);
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Unique backer count (confirmed contributions)
  const [backerCountRow] = await db
    .select({ count: sql<string>`count(distinct ${contributions.backerEmail})` })
    .from(contributions)
    .where(and(eq(contributions.campaignId, id), eq(contributions.status, 'confirmed')));
  const uniqueBackerCount = parseInt(backerCountRow?.count ?? '0', 10);

  // Recent contributors (last 10 confirmed)
  const recentRows = await db
    .select({
      backerId: contributions.backerId,
      backerEmail: contributions.backerEmail,
      amount: contributions.amount,
      currency: contributions.currency,
      anonymous: contributions.anonymous,
      createdAt: contributions.createdAt,
    })
    .from(contributions)
    .where(and(eq(contributions.campaignId, id), eq(contributions.status, 'confirmed')))
    .orderBy(desc(contributions.createdAt))
    .limit(10);

  // Fetch display names for non-anonymous backers who have accounts
  const backerIds = recentRows
    .filter((r) => !r.anonymous && r.backerId)
    .map((r) => r.backerId as string);

  const backerNames = new Map<string, string>();
  if (backerIds.length > 0) {
    const backerUsers = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(sql`${users.id} = ANY(${backerIds})`);
    for (const u of backerUsers) {
      backerNames.set(u.id, u.displayName);
    }
  }

  const recentContributors = recentRows.map((r) => {
    let displayName = 'Anonymous';
    if (!r.anonymous) {
      if (r.backerId && backerNames.has(r.backerId)) {
        displayName = backerNames.get(r.backerId)!;
      } else {
        // Guest contributor — use email prefix
        displayName = r.backerEmail.split('@')[0];
      }
    }
    return {
      displayName,
      amount: r.amount,
      currency: r.currency,
      createdAt: r.createdAt,
    };
  });

  return NextResponse.json({
    fundingProgressPercent: parseFloat(fundingProgressPercent.toFixed(2)),
    totalRaised: totalRaised.toString(),
    goalAmount: campaign.goalAmount,
    currency: campaign.currency,
    uniqueBackerCount,
    daysRemaining,
    recentContributors,
  });
}
