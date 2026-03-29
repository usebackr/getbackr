import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getPublicUrl } from '@/lib/storage';

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
        raised: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
        backers: sql<number>`COUNT(DISTINCT ${contributions.backerEmail})::int`,
        status: campaigns.status,
      })
      .from(campaigns)
      .leftJoin(
        contributions,
        sql`${contributions.campaignId} = ${campaigns.id} AND ${contributions.status} = 'confirmed'`,
      )
      .where(eq(campaigns.creatorId, userId))
      .groupBy(campaigns.id)
      .orderBy(desc(campaigns.createdAt));

    // Cleanup URLs
    const sanitized = userCampaigns.map(c => ({
      ...c,
      coverImageUrl: getPublicUrl(c.coverImageUrl)
    }));

    return NextResponse.json({ campaigns: sanitized });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
