import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Current subscription (most recent active or cancelled)
  const current = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.creatorId, auth.userId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // Billing history (all subscriptions)
  const history = await db.query.subscriptions.findMany({
    where: eq(subscriptions.creatorId, auth.userId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  // User premium status
  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
    columns: { premiumStatus: true, premiumExpiresAt: true },
  });

  return NextResponse.json({
    premiumStatus: user?.premiumStatus ?? 'none',
    premiumExpiresAt: user?.premiumExpiresAt ?? null,
    currentSubscription: current ?? null,
    billingHistory: history,
  });
}
