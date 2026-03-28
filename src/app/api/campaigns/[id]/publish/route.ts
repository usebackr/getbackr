import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';

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

  if (campaign.status !== 'draft') {
    return NextResponse.json(
      {
        error: `Campaign cannot be published from status '${campaign.status}'. Only draft campaigns can be published.`,
      },
      { status: 422 },
    );
  }

  const [updated] = await db
    .update(campaigns)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    status: updated.status,
  });
}
