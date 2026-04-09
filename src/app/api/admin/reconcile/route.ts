import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { verifyTransaction } from '@/lib/payments/paystack';
import { processSuccessfulPayment } from '@/lib/payments/fulfillment';
import { eq, and, gt, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('--- Starting Payment Reconciliation via API (Last 5 Hours) ---');
    
    // Get current time - 5 hours
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    
    // Fetch all pending contributions from the last 5 hours
    const pendingContributions = await db
      .select()
      .from(contributions)
      .where(
        and(
          eq(contributions.status, 'pending'),
          gt(contributions.createdAt, fiveHoursAgo)
        )
      )
      .orderBy(desc(contributions.createdAt));

    const results = [];

    for (const contribution of pendingContributions) {
      if (!contribution.paymentReference) continue;

      try {
        const paystackData = await verifyTransaction(contribution.paymentReference);
        
        if (paystackData.status === 'success') {
          await processSuccessfulPayment({
            reference: paystackData.reference,
            amountInMajor: paystackData.amount / 100,
            currency: paystackData.currency || 'NGN',
            customerEmail: paystackData.customer?.email || contribution.backerEmail || '',
            channel: paystackData.channel || 'paystack',
            metadata: paystackData.metadata || {},
          });
          results.push({ reference: contribution.paymentReference, status: 'fulfilled' });
        } else {
          results.push({ reference: contribution.paymentReference, status: paystackData.status });
        }
      } catch (err) {
        results.push({ reference: contribution.paymentReference, status: 'error', error: String(err) });
      }
    }

    return NextResponse.json({
      processed: pendingContributions.length,
      results
    });
  } catch (error) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
