import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { verifyTransaction } from '@/lib/payments/paystack';
import { processSuccessfulPayment } from '@/lib/payments/fulfillment';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  try {
    const [contribution] = await db
      .select({ status: contributions.status })
      .from(contributions)
      .where(eq(contributions.paymentReference, reference))
      .limit(1);

    if (!contribution) {
      // PROACTIVE FALLBACK: If DB lacks the record, the webhook might have been missed/delayed.
      // We actively poll Paystack to verify if it was actually successful.
      try {
        const paystackData = await verifyTransaction(reference);
        
        if (paystackData.status === 'success') {
          // It was successful on Paystack! The webhook failed to reach us.
          // Fulfill it proactively right now.
          await processSuccessfulPayment({
            reference: paystackData.reference,
            amountInMajor: paystackData.amount / 100,
            currency: paystackData.currency || 'NGN',
            customerEmail: paystackData.customer?.email || '',
            channel: paystackData.channel || 'paystack',
            metadata: paystackData.metadata || {},
          });
          
          return NextResponse.json({ status: 'confirmed' });
        }
      } catch (verifyErr) {
        console.warn('[Check Status] Paystack proactive verify failed or transaction not found', verifyErr);
      }

      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({ status: contribution.status });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
