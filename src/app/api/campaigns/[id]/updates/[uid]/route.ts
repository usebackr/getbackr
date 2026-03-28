import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { requireAuth } from '@/lib/auth/middleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; uid: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: campaignId, uid: updateId } = params;

  // Verify campaign ownership
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creatorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch the update
  const update = await db.query.campaignUpdates.findFirst({
    where: eq(campaignUpdates.id, updateId),
  });

  if (!update || update.campaignId !== campaignId) {
    return NextResponse.json({ error: 'Update not found' }, { status: 404 });
  }

  if (update.deletedAt) {
    return NextResponse.json({ error: 'Update already deleted' }, { status: 410 });
  }

  // Soft-delete
  await db
    .update(campaignUpdates)
    .set({ deletedAt: new Date() })
    .where(eq(campaignUpdates.id, updateId));

  return NextResponse.json({ message: 'Update deleted' });
}
