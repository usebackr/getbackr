import { NextRequest, NextResponse } from 'next/server';
import { eq, sum, count } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = payload.sub as string;

    // Fetch total campaigns
    const [{ campaignCount }] = await db
      .select({ campaignCount: count() })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    // Fetch wallet stats (raised and withdrawable)
    let totalRaised = 0;
    let withdrawable = 0;

    const userWallets = await db
      .select({
        balance: projectWallets.balance,
        totalReceived: projectWallets.totalReceived,
      })
      .from(projectWallets)
      .innerJoin(campaigns, eq(campaigns.id, projectWallets.campaignId))
      .where(eq(campaigns.creatorId, userId));

    for (const wallet of userWallets) {
      totalRaised += Number(wallet.totalReceived || 0);
      withdrawable += Number(wallet.balance || 0);
    }

    // Fetch total views across all campaigns - wrapped in try/catch for stability
    let finalViews = 0;
    try {
      const viewRes = await db
        .select({ totalViews: sum(campaigns.views) })
        .from(campaigns)
        .where(eq(campaigns.creatorId, userId));
      finalViews = Number(viewRes[0]?.totalViews || 0);
    } catch (viewErr) {
      console.error('[Stats] Views column might be missing:', viewErr);
    }

    return NextResponse.json({
      totalRaised,
      withdrawable,
      totalCampaigns: Number(campaignCount || 0),
      totalViews: finalViews,
      currency: '₦',
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
