import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const userCampaigns = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        slug: campaigns.slug,
        category: campaigns.category,
        coverImageUrl: campaigns.coverImageUrl,
        goalAmount: campaigns.goalAmount,
        endDate: campaigns.endDate,
        createdAt: campaigns.createdAt,
        raised: projectWallets.totalReceived,
        status: campaigns.status,
      })
      .from(campaigns)
      .leftJoin(projectWallets, eq(projectWallets.campaignId, campaigns.id))
      .where(eq(campaigns.creatorId, userId))
      .orderBy(desc(campaigns.createdAt));

    return NextResponse.json({ campaigns: userCampaigns });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
