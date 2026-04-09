import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { verifyTransaction } from '@/lib/payments/paystack';
import { processSuccessfulPayment } from '@/lib/payments/fulfillment';
import { eq, and, gt, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    console.log(`--- Starting Payment Reconciliation via API (Last ${hours} Hours) ---`);
    
    // Get current time - specified hours
    const lookbackTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Fetch all pending contributions from the lookback period
    const pendingContributions = await db
      .select()
      .from(contributions)
      .where(
        and(
          eq(contributions.status, 'pending'),
          gt(contributions.createdAt, lookbackTime)
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
  } catch (error: any) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
