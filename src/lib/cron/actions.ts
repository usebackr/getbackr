import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';

/**
 * Maintenance Action: Auto-close expired campaigns
 */
export async function closeExpiredCampaigns() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const closed = await db
    .update(campaigns)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(sql`${campaigns.status} = 'active' AND ${campaigns.endDate} < ${today}::date`)
    .returning({ id: campaigns.id, slug: campaigns.slug });

  return { closedCount: closed.length, items: closed };
}

/**
 * Maintenance Action: Expire past boosts
 */
export async function expireBoosts() {
  const now = new Date();

  const expired = await db
    .update(boostPurchases)
    .set({ status: 'expired' })
    .where(sql`${boostPurchases.status} = 'active' AND ${boostPurchases.expiresAt} < ${now}`)
    .returning({ id: boostPurchases.id });

  return { expiredCount: expired.length, items: expired };
}

/**
 * Maintenance Action: Expire subscriptions
 */
export async function expireSubscriptions() {
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // 1. Expire active past period end
  const expiredActive = await db
    .update(subscriptions)
    .set({ status: 'expired' })
    .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.currentPeriodEnd} < ${now}`)
    .returning({ id: subscriptions.id, creatorId: subscriptions.creatorId });

  // 2. Expire grace past period_end + 7 days
  const graceCutoff = new Date(now.getTime() - sevenDaysMs);
  const expiredGrace = await db
    .update(subscriptions)
    .set({ status: 'expired' })
    .where(
      sql`${subscriptions.status} = 'grace' AND ${subscriptions.currentPeriodEnd} < ${graceCutoff}`,
    )
    .returning({ id: subscriptions.id, creatorId: subscriptions.creatorId });

  const allExpired = [...expiredActive, ...expiredGrace];

  // Sync user premium status
  for (const sub of allExpired) {
    await db
      .update(users)
      .set({ premiumStatus: 'none', updatedAt: now })
      .where(eq(users.id, sub.creatorId));
  }

  return { expiredCount: allExpired.length, items: allExpired };
}

/**
 * Unified Maintenance Runner
 */
export async function runMaintenance() {
  console.log('[Maintenance] Starting platform cleanup...');

  const campaignsResult = await closeExpiredCampaigns();
  const boostsResult = await expireBoosts();
  const subsResult = await expireSubscriptions();

  console.log('[Maintenance] Finished:', {
    campaignsClosed: campaignsResult.closedCount,
    boostsExpired: boostsResult.expiredCount,
    subsExpired: subsResult.expiredCount,
  });

  return {
    campaigns: campaignsResult,
    boosts: boostsResult,
    subscriptions: subsResult,
  };
}
