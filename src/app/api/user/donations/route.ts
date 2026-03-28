import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { campaigns } from '@/db/schema/campaigns';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const userDonations = await db
      .select({
        id: contributions.id,
        amount: contributions.amount,
        status: contributions.status,
        createdAt: contributions.createdAt,
        campaignTitle: campaigns.title,
        campaignSlug: campaigns.slug,
      })
      .from(contributions)
      .leftJoin(campaigns, eq(campaigns.id, contributions.campaignId))
      .where(eq(contributions.backerId, userId))
      .orderBy(desc(contributions.createdAt))
      .limit(50);

    return NextResponse.json({ donations: userDonations });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}
