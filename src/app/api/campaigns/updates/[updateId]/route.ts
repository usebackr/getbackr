import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { updateId: string } }
) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { updateId } = params;

    // 1. Fetch update to find campaignId
    const update = await db.query.campaignUpdates.findFirst({
      where: eq(campaignUpdates.id, updateId),
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // 2. Fetch campaign to verify ownership
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, update.campaignId),
    });

    if (!campaign || campaign.creatorId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Soft delete
    await db.update(campaignUpdates)
      .set({ deletedAt: new Date() })
      .where(eq(campaignUpdates.id, updateId));

    return NextResponse.json({ message: 'Update deleted successfully' });
  } catch (err) {
    console.error('[DeleteUpdate] Error:', err);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}
