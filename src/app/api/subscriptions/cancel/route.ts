import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find the most recent active subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.creatorId, auth.userId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  if (!subscription) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  if (subscription.status === 'cancelled') {
    return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 409 });
  }

  if (subscription.status === 'expired') {
    return NextResponse.json({ error: 'Subscription has already expired' }, { status: 409 });
  }

  // Cancel subscription
  await db
    .update(subscriptions)
    .set({ status: 'cancelled' })
    .where(eq(subscriptions.id, subscription.id));

  // Revoke premium access
  await db
    .update(users)
    .set({ premiumStatus: 'none', updatedAt: new Date() })
    .where(eq(users.id, auth.userId));

  return NextResponse.json({ message: 'Subscription cancelled successfully' });
}
