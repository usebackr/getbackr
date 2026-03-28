import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

/**
 * Processes the `boost:expiry` queue.
 * Sets status='expired' for all active boosts whose expires_at is in the past.
 */
export function registerBoostExpiryWorker(): void {
  const queue = getQueue(QUEUE_NAMES.BOOST_EXPIRY);

  queue.process(async () => {
    const now = new Date();

    const expired = await db
      .update(boostPurchases)
      .set({ status: 'expired' })
      .where(sql`${boostPurchases.status} = 'active' AND ${boostPurchases.expiresAt} < ${now}`)
      .returning({ id: boostPurchases.id, campaignId: boostPurchases.campaignId });

    if (expired.length > 0) {
      console.log(
        `[boostExpiry] Expired ${expired.length} boost(s):`,
        expired.map((b: { id: string; campaignId: string }) => b.id),
      );
    }

    return { expiredCount: expired.length };
  });
}
