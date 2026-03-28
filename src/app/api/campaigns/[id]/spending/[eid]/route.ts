import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { spendingLogs } from '@/db/schema/spendingLogs';

// DELETE /api/campaigns/[id]/spending/[eid] — soft-delete, creator only
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; eid: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;
  const { id, eid } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entry = await db.query.spendingLogs.findFirst({
    where: and(eq(spendingLogs.id, eid), eq(spendingLogs.campaignId, id)),
  });
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  if (entry.deletedAt !== null) {
    return NextResponse.json({ error: 'Entry already deleted' }, { status: 422 });
  }

  await db
    .update(spendingLogs)
    .set({ deletedAt: new Date() })
    .where(and(eq(spendingLogs.id, eid), eq(spendingLogs.campaignId, id)));

  return NextResponse.json({ message: 'Entry removed' });
}
