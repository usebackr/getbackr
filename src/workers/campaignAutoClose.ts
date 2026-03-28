import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

/**
 * Processes the `campaign:auto-close` queue.
 * Sets status='closed' for all active campaigns whose end_date is in the past.
 */
export function registerCampaignAutoCloseWorker(): void {
  const queue = getQueue(QUEUE_NAMES.CAMPAIGN_AUTO_CLOSE);

  queue.process(async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const closed = await db
      .update(campaigns)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(sql`${campaigns.status} = 'active' AND ${campaigns.endDate} < ${today}::date`)
      .returning({ id: campaigns.id, slug: campaigns.slug });

    if (closed.length > 0) {
      console.log(
        `[campaignAutoClose] Closed ${closed.length} expired campaign(s):`,
        closed.map((c: { id: string; slug: string }) => c.slug),
      );
    }

    return { closedCount: closed.length };
  });
}
