import { db } from '../src/lib/db';
import { contributions } from '../src/db/schema/contributions';
import { projectWallets } from '../src/db/schema/projectWallets';
import { sql, eq } from 'drizzle-orm';

/**
 * DATABASE CLEANUP SCRIPT
 * Rounds all existing messy contribution amounts and re-syncs wallet totals.
 * Run this once after deployment to "standardize" old data.
 */
async function cleanup() {
  console.log('Starting Database Cleanup: Standardizing Currency Amounts (No Decimals)...');

  try {
    // 1. Fetch all confirmed contributions
    const confirmedContributions = await db
      .select()
      .from(contributions)
      .where(eq(contributions.status, 'confirmed'));

    console.log(`Found ${confirmedContributions.length} confirmed contributions to process.`);

    let roundedCount = 0;
    for (const c of confirmedContributions) {
      const originalAmount = parseFloat(c.amount || '0');
      const roundedAmount = Math.floor(originalAmount);

      if (originalAmount !== roundedAmount) {
        // Also update platformFee and netAmount to be clean relative to the rounded amount
        // Assuming Backr 5%
        const newPlatformFee = roundedAmount * 0.05;
        const newNetAmount = roundedAmount - newPlatformFee;

        await db
          .update(contributions)
          .set({
            amount: roundedAmount.toString(),
            platformFee: newPlatformFee.toString(),
            netAmount: newNetAmount.toString(),
          })
          .where(eq(contributions.id, c.id));
        
        roundedCount++;
      }
    }

    console.log(`Finished rounding ${roundedCount} messy contributions.`);

    // 2. Re-sync Project Wallets
    const wallets = await db.select().from(projectWallets);
    console.log(`Re-syncing ${wallets.length} campaign wallets...`);

    for (const wallet of wallets) {
      const totalsResult = await db
        .select({
          sumAmount: sql<number>`COALESCE(SUM(CAST(${contributions.amount} AS NUMERIC)), 0)`,
          sumNet: sql<number>`COALESCE(SUM(CAST(${contributions.netAmount} AS NUMERIC)), 0)`,
        })
        .from(contributions)
        .where(
          sql`${contributions.campaignId} = ${wallet.campaignId} AND ${contributions.status} = 'confirmed'`
        );

      const { sumAmount, sumNet } = totalsResult[0];

      await db
        .update(projectWallets)
        .set({
          totalReceived: sumAmount.toString(),
          balance: sumNet.toString(), // Note: This assumes current balance matches net earnings for simplicity
          updatedAt: new Date(),
        })
        .where(eq(projectWallets.id, wallet.id));
    }

    console.log('Wallet totals successfully re-synchronized with clean data.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
