import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;
    const campaignId = params.id;

    // 1. Verify ownership and current status
    const [campaign] = await db
      .select({ creatorId: campaigns.creatorId, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this campaign' }, { status: 403 });
    }

    if (campaign.status === 'closed') {
      return NextResponse.json({ error: 'Campaign is already closed' }, { status: 400 });
    }

    // 2. Perform the permanent closure
    await db
      .update(campaigns)
      .set({ 
        status: 'closed',
        updatedAt: new Date()
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.creatorId, userId)));

    return NextResponse.json({ 
      message: 'Campaign has been successfully ended and is now closed for withdrawals.',
      status: 'closed'
    });
  } catch (error: any) {
    console.error('[Campaign Close API Error]', error);
    return NextResponse.json({ error: 'Server error closing campaign' }, { status: 500 });
  }
}
