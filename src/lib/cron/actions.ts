import { sql, eq, and, gt, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { contributions } from '@/db/schema/contributions';
import { verifyTransaction } from '@/lib/payments/paystack';
import { processSuccessfulPayment } from '@/lib/payments/fulfillment';

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
 * Maintenance Action: Reconcile pending payments (Fallback for missed webhooks)
 */
export async function reconcilePendingPayments() {
  console.log('[Maintenance] Scanning for pending contributions...');
  
  // Find pending contributions from the last 2 days
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  const pending = await db
    .select()
    .from(contributions)
    .where(
      and(
        eq(contributions.status, 'pending'),
        gt(contributions.createdAt, twoDaysAgo)
      )
    );

  console.log(`[Maintenance] Found ${pending.length} pending contributions to check.`);
  
  const results = {
    checked: pending.length,
    processed: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const contribution of pending) {
    if (!contribution.paymentReference) continue;
    
    try {
      const verification = await verifyTransaction(contribution.paymentReference);
      
      if (verification && verification.status === 'success') {
        console.log(`[Maintenance] Found paid transaction for reference ${contribution.paymentReference}. Fulfilling...`);
        
        await processSuccessfulPayment({
          reference: contribution.paymentReference,
          amountInMajor: verification.amount / 100,
          currency: verification.currency,
          customerEmail: verification.customer.email,
          channel: verification.channel,
          metadata: verification.metadata || {},
        });
        
        results.processed++;
      }
    } catch (err: any) {
      console.error(`[Maintenance] Failed to verify ${contribution.paymentReference}:`, err.message);
      results.failed++;
      results.errors.push(`${contribution.paymentReference}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Unified Maintenance Runner
 */
export async function runMaintenance() {
  console.log('[Maintenance] Starting platform cleanup...');

  const campaignsResult = await closeExpiredCampaigns();
  const boostsResult = await expireBoosts();
  const subsResult = await expireSubscriptions();
  const reconcileResult = await reconcilePendingPayments();

  console.log('[Maintenance] Finished:', {
    campaignsClosed: campaignsResult.closedCount,
    boostsExpired: boostsResult.expiredCount,
    subsExpired: subsResult.expiredCount,
    paymentsReconciled: reconcileResult.processed
  });

  return {
    campaigns: campaignsResult,
    boosts: boostsResult,
    subscriptions: subsResult,
    reconciliation: reconcileResult
  };
}

/**
 * Maintenance Action: Generate Weekly Digest
 * Runs once a week (Friday 10 AM)
 */
export async function runWeeklyDigest() {
  console.log('[Digest] Generating weekly roundup...');
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // 1. Find Trending Creators (Most raised in last 7 days)
  const trending = await db
    .select({
      displayName: users.displayName,
      username: users.username,
      campaignTitle: campaigns.title,
      totalAmount: sql<number>`SUM(${contributions.amount})::numeric`,
    })
    .from(contributions)
    .innerJoin(campaigns, eq(contributions.campaignId, campaigns.id))
    .innerJoin(users, eq(campaigns.creatorId, users.id))
    .where(
      and(
        eq(contributions.status, 'confirmed'),
        gt(contributions.createdAt, sevenDaysAgo)
      )
    )
    .groupBy(users.id, campaigns.id)
    .orderBy(sql`SUM(${contributions.amount}) DESC`)
    .limit(3);

  // 2. Find New Campaigns (launched in last 7 days)
  const newCampaigns = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.status, 'active'),
        gt(campaigns.createdAt, sevenDaysAgo)
      )
    )
    .orderBy(campaigns.createdAt)
    .limit(5);

  console.log(`[Digest] Found ${trending.length} trending creators and ${newCampaigns.length} new campaigns.`);

  const { sendWeeklyDigestEmail } = await import('@/workers/emailWorkers');
  const result = await sendWeeklyDigestEmail({
    trendingCreators: trending.map(t => ({
      ...t,
      username: t.username || 'user',
      totalAmount: Number(t.totalAmount)
    })),
    newCampaigns: newCampaigns as any,
  });

  return { 
    sentCount: result.sent,
    trending: trending.length,
    newCampaigns: newCampaigns.length 
  };
}
