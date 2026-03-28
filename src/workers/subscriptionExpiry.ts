import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

/**
 * Processes the `subscription:expiry` queue.
 * - Active subscriptions past current_period_end → expired, user premium_status='none'
 * - Grace subscriptions past current_period_end + 7 days → expired, user premium_status='none'
 */
export function registerSubscriptionExpiryWorker(): void {
  const queue = getQueue(QUEUE_NAMES.SUBSCRIPTION_EXPIRY);

  queue.process(async () => {
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Expire active subscriptions past their period end
    const expiredActive = await db
      .update(subscriptions)
      .set({ status: 'expired' })
      .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.currentPeriodEnd} < ${now}`)
      .returning({ id: subscriptions.id, creatorId: subscriptions.creatorId });

    // Expire grace subscriptions past period_end + 7 days
    const graceCutoff = new Date(now.getTime() - sevenDaysMs);
    const expiredGrace = await db
      .update(subscriptions)
      .set({ status: 'expired' })
      .where(
        sql`${subscriptions.status} = 'grace' AND ${subscriptions.currentPeriodEnd} < ${graceCutoff}`,
      )
      .returning({ id: subscriptions.id, creatorId: subscriptions.creatorId });

    const allExpired = [...expiredActive, ...expiredGrace];

    // Update premium_status to 'none' for affected creators
    for (const sub of allExpired) {
      await db
        .update(users)
        .set({ premiumStatus: 'none', updatedAt: now })
        .where(eq(users.id, sub.creatorId));
    }

    if (allExpired.length > 0) {
      console.log(
        `[subscriptionExpiry] Expired ${allExpired.length} subscription(s):`,
        allExpired.map((s: { id: string; creatorId: string }) => s.id),
      );
    }

    return { expiredCount: allExpired.length };
  });
}
