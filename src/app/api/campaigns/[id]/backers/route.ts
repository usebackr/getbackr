import { NextRequest, NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // 1. Verify that the requester is the campaign creator
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creatorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Fetch all confirmed contributions with backer details
  const backerList = await db
    .select({
      id: contributions.id,
      amount: contributions.amount,
      currency: contributions.currency,
      anonymous: contributions.anonymous,
      createdAt: contributions.createdAt,
      backerEmail: contributions.backerEmail,
      storedName: contributions.backerName,
      userDisplayName: users.displayName,
    })
    .from(contributions)
    .leftJoin(users, eq(users.id, contributions.backerId))
    .where(and(eq(contributions.campaignId, id), eq(contributions.status, 'confirmed')))
    .orderBy(contributions.createdAt);

  const backerListResult = backerList.map(b => ({
    id: b.id,
    amount: b.amount,
    currency: b.currency,
    anonymous: b.anonymous,
    createdAt: b.createdAt,
    backerEmail: b.backerEmail,
    backerName: b.userDisplayName || b.storedName || 'A Supporter'
  }));

  return NextResponse.json({ backers: backerListResult });
}
