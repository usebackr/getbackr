import { db } from './src/lib/db';
import { contributions } from './src/db/schema/contributions';
import { processSuccessfulPayment } from './src/lib/payments/fulfillment';
import { verifyTransaction } from './src/lib/payments/paystack';
import { eq, and, gt } from 'drizzle-orm';

async function reconcileRecentPayments() {
  console.log('--- Starting Payment Reconciliation ---');
  
  // 1. Find all pending contributions from the last 5 hours
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  
  const pending = await db
    .select()
    .from(contributions)
    .where(
      and(
        eq(contributions.status, 'pending'),
        gt(contributions.createdAt, fiveHoursAgo)
      )
    );

  console.log(`Found ${pending.length} pending contributions to check.`);

  for (const contribution of pending) {
    try {
      console.log(`Checking reference: ${contribution.paymentReference}...`);
      const paystackData = await verifyTransaction(contribution.paymentReference);
      
      if (paystackData.status === 'success') {
        console.log(`Reference ${contribution.paymentReference} was successful! Fulfilling...`);
        await processSuccessfulPayment({
          reference: paystackData.reference,
          amountInMajor: paystackData.amount / 100,
          currency: paystackData.currency,
          customerEmail: paystackData.customer.email,
          channel: paystackData.channel,
          metadata: paystackData.metadata || {},
        });
        console.log(`Successfully fulfilled ${contribution.paymentReference}.`);
      } else {
        console.log(`Reference ${contribution.paymentReference} is still ${paystackData.status}.`);
      }
    } catch (err) {
      console.error(`Failed to reconcile ${contribution.paymentReference}:`, err);
    }
  }
  
  console.log('--- Reconciliation Finished ---');
  process.exit(0);
}

reconcileRecentPayments().catch(err => {
  console.error('Fatal reconciliation error:', err);
  process.exit(1);
});
