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
    const manualRef = searchParams.get('reference');
    
    const results = [];

    // --- CASE 1: Specific Reference Check ---
    if (manualRef) {
      console.log(`--- Manually Reconciling Reference: ${manualRef} ---`);
      try {
        const paystackData = await verifyTransaction(manualRef);
        if (paystackData.status === 'success') {
          // Check if we have a campaignId in metadata (required for fulfillment)
          const campaignId = paystackData.metadata?.campaignId;
          
          if (!campaignId) {
            results.push({ 
              reference: manualRef, 
              status: 'error', 
              error: 'No campaignId found in Paystack metadata. Cannot fulfill manually without knowing which campaign it belongs to.' 
            });
          } else {
            await processSuccessfulPayment({
              reference: paystackData.reference,
              amountInMajor: paystackData.amount / 100,
              currency: paystackData.currency || 'NGN',
              customerEmail: paystackData.customer?.email || '',
              channel: paystackData.channel || 'paystack',
              metadata: paystackData.metadata || {},
            });
            results.push({ reference: manualRef, status: 'fulfilled' });
          }
        } else {
          results.push({ reference: manualRef, status: paystackData.status });
        }
      } catch (err: any) {
        results.push({ reference: manualRef, status: 'error', error: err.message });
      }
      
      return NextResponse.json({ processed: 1, results });
    }

    // --- CASE 2: Bulk Reconciliation (Pending from Last X Hours) ---
    console.log(`--- Starting Bulk Reconciliation (Last ${hours} Hours) ---`);
    const lookbackTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
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
      } catch (err: any) {
        results.push({ reference: contribution.paymentReference, status: 'error', error: err.message });
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
