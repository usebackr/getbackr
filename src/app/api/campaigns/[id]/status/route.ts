export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;
    const { id: campaignId } = params;

    const { status } = await req.json();

    // Valid status transitions for creators
    const allowedStatuses = ['active', 'closed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Ensure the campaign exists and belongs to this user
    const [campaign] = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.creatorId, userId)))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
    }

    // Update status
    await db
      .update(campaigns)
      .set({ 
        status: status as any, 
        updatedAt: new Date() 
      })
      .where(eq(campaigns.id, campaignId));

    return NextResponse.json({ message: `Campaign status updated to ${status}` });

  } catch (error: any) {
    console.error('[Campaign Status Check API Error]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
