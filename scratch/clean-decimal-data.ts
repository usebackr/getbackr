import { db } from '../src/lib/db';
import { contributions } from '../src/db/schema/contributions';
import { projectWallets } from '../src/db/schema/projectWallets';
import { sql, eq } from 'drizzle-orm';

/**
 * SMART DATABASE CLEANUP SCRIPT (DRY RUN MODE)
 * Reconstructs intended donation amounts by reversing Paystack's surcharge math.
 */
async function cleanup(dryRun = true) {
  console.log(`--- ${dryRun ? 'DRY RUN' : 'PRODUCTION'} CLEANUP START ---`);
  console.log('Target: Filtering out Paystack 1.5% (+ ₦100) surcharges from legacy data.');

  try {
    const confirmedContributions = await db
      .select()
      .from(contributions)
      .where(eq(contributions.status, 'confirmed'));

    let processedCount = 0;
    let fixableCount = 0;

    for (const c of confirmedContributions) {
      const gross = parseFloat(c.amount || '0');
      
      // If it has decimals or looks like a typical Paystack gross-up (e.g. 1015)
      // We check if it's already a clean round number like 1000, 5000, etc.
      const isClean = Number.isInteger(gross) && (gross % 50 === 0);
      
      if (!isClean) {
        // Reverse Formula
        // cand1: No 100 fee (< 2500)
        // cand2: With 100 fee (>= 2500)
        const cand1 = Math.round(gross * 0.985);
        const cand2 = Math.round(gross * 0.985 - 100);
        
        let intended = cand1;
        if (cand2 >= 2500) intended = cand2;

        console.log(`[Reconstruct] Original: ₦${gross} -> Detected Intended: ₦${intended} (Fee removed: ₦${(gross - intended).toFixed(2)})`);
        fixableCount++;

        if (!dryRun) {
          const newPlatformFee = intended * 0.05;
          const newNetAmount = intended - newPlatformFee;

          await db
            .update(contributions)
            .set({
              amount: intended.toString(),
              platformFee: newPlatformFee.toString(),
              netAmount: newNetAmount.toString(),
            })
            .where(eq(contributions.id, c.id));
        }
      }
      processedCount++;
    }

    console.log(`\nSummary:`);
    console.log(`Total records checked: ${processedCount}`);
    console.log(`Messy records found: ${fixableCount}`);
    
    if (dryRun) {
      console.log('--- DRY RUN COMPLETE. No changes made to Database. ---');
    } else {
      console.log('--- DATA FIXED. Re-syncing wallets... ---');
      await syncWallets();
      console.log('--- ALL SYSTEMS CLEAN. ---');
    }

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

async function syncWallets() {
    const wallets = await db.select().from(projectWallets);
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
          balance: sumNet.toString(),
          updatedAt: new Date(),
        })
        .where(eq(projectWallets.id, wallet.id));
    }
}

// Default to Dry Run
const isProduction = process.argv.includes('--run');
cleanup(!isProduction);
