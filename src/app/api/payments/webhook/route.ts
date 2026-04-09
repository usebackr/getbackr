export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/paystack';
import { processSuccessfulPayment } from '@/lib/payments/fulfillment';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  const secret = process.env.PAYSTACK_SECRET_KEY || '';

  // 1. Verify Signature
  console.log('[Paystack Webhook] Incoming Request Received at:', new Date().toISOString());

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.error('[Paystack Webhook] Invalid Signature—Authentication failed.');
    return new NextResponse('Invalid Signature', { status: 401 });
  }

  console.log('[Paystack Webhook] Signature Verified. Processing event...');

  const event = JSON.parse(rawBody);

  // 2. Handle Charge Success
  if (event.event === 'charge.success') {
    const data = event.data;
    const metadata = data.metadata || {};
    const campaignId = (metadata.campaignId || '').trim();
    const amountInKobo = data.amount;
    const amountInMajor = amountInKobo / 100;
    const reference = data.reference;

    if (!campaignId) {
      console.warn('[Paystack Webhook] Missing campaignId in metadata', reference);
      return NextResponse.json({ status: 'ignored', message: 'Missing campaignId' });
    }

    try {
      console.log(`[Paystack Webhook] Found charge.success for ${reference}`);
      
      const result = await processSuccessfulPayment({
        reference,
        amountInMajor,
        currency: data.currency || 'NGN',
        customerEmail: data.customer?.email || '',
        channel: data.channel || 'paystack',
        metadata,
      });

      if (result.status === 'success') {
        console.log(`[Paystack Webhook] Successfully processed reference ${reference}`);
        return NextResponse.json({ status: 'success' });
      } else {
        console.log(`[Paystack Webhook] Reference ${reference} was skipped/ignored: ${result.message}`);
        return NextResponse.json({ status: 'ignored', message: result.message });
      }
    } catch (err: any) {
      console.error(`[Paystack Webhook] Error processing reference ${reference}:`, err.message);
      // Return 500 so Paystack retries if it's a transient error
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  // Acknowledge but ignore other events
  return NextResponse.json({ status: 'ignored' });
}
