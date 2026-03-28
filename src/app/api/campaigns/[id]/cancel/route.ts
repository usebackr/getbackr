import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;
  const { id } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (campaign.status === 'cancelled') {
    return NextResponse.json({ error: 'Campaign is already cancelled' }, { status: 422 });
  }

  if (campaign.status === 'closed') {
    return NextResponse.json({ error: 'Cannot cancel a closed campaign' }, { status: 422 });
  }

  // Check for any confirmed contributions
  const confirmedContribution = await db.query.contributions.findFirst({
    where: and(eq(contributions.campaignId, id), eq(contributions.status, 'confirmed')),
  });

  if (confirmedContribution) {
    return NextResponse.json(
      { error: 'Cannot cancel a campaign with confirmed contributions. Issue refunds first.' },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(campaigns)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    status: updated.status,
  });
}
