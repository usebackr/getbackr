import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { projectWallets } from '@/db/schema/projectWallets';
import { campaigns } from '@/db/schema/campaigns';
import { notifications } from '@/db/schema/notifications';
import { users } from '@/db/schema/users';
import { verifyWebhookSignature } from '@/lib/payments/paystack';
import { eq, sql } from 'drizzle-orm';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  const secret = process.env.PAYSTACK_SECRET_KEY || '';

  // 1. Verify Signature
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    console.error('[Paystack Webhook] Invalid Signature');
    return new NextResponse('Invalid Signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // 2. Handle Charge Success
  if (event.event === 'charge.success') {
    const data = event.data;
    const metadata = data.metadata || {};
    const { campaignId, backerId } = metadata;
    const amountInKobo = data.amount;
    const amountInMajor = amountInKobo / 100;
    const reference = data.reference;

    if (!campaignId) {
      console.warn('[Paystack Webhook] Missing campaignId in metadata', reference);
      return NextResponse.json({ status: 'ignored', message: 'Missing campaignId' });
    }

    // Calculate 5% Platform Fee
    const platformFee = amountInMajor * 0.05;
    const netAmount = amountInMajor - platformFee;

    try {
      await db.transaction(async (tx) => {
        // A. Idempotency: skip if already processed
        const existing = await tx
          .select({ id: contributions.id })
          .from(contributions)
          .where(sql`${contributions.paymentReference} = ${reference}`)
          .limit(1);

        if (existing.length > 0) return;

        // B. Insert confirmed contribution
        await tx.insert(contributions).values({
          campaignId,
          backerId: backerId || null,
          backerEmail: data.customer.email,
          amount: amountInMajor.toString(),
          platformFee: platformFee.toString(),
          netAmount: netAmount.toString(),
          currency: data.currency || 'NGN',
          paymentReference: reference,
          paymentMethod: data.channel || 'paystack',
          status: 'confirmed',
        });

        // C. Update campaign's project wallet (atomic increment)
        await tx
          .update(projectWallets)
          .set({
            balance: sql`${projectWallets.balance} + ${netAmount}::numeric`,
            totalReceived: sql`${projectWallets.totalReceived} + ${amountInMajor}::numeric`,
            updatedAt: new Date(),
          })
          .where(eq(projectWallets.campaignId, campaignId));

        // D. Fetch campaign creator details
        const [campaignDetails] = await tx
          .select({
            title: campaigns.title,
            creatorId: campaigns.creatorId,
            creatorEmail: users.email,
          })
          .from(campaigns)
          .leftJoin(users, eq(users.id, campaigns.creatorId))
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (campaignDetails) {
          // E. Create internal notification for creator
          await tx.insert(notifications).values({
            userId: campaignDetails.creatorId,
            type: 'donation_received',
            title: 'New Donation Received!',
            message: `You received a donation of ${data.currency} ${amountInMajor.toLocaleString()} for your campaign "${campaignDetails.title}".`,
            metadata: JSON.stringify({ campaignId, amount: amountInMajor }),
          });

          // F. Queue Emails via Workers
          const emailQueue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);

          // Email to Donor (Receipt)
          await emailQueue.add({
            type: 'donor_receipt',
            backerEmail: data.customer.email,
            amount: amountInMajor,
            currency: data.currency,
            campaignTitle: campaignDetails.title,
          });

          // Email to Creator (Alert)
          if (campaignDetails.creatorEmail) {
            await emailQueue.add({
              type: 'creator_alert',
              backerEmail: campaignDetails.creatorEmail,
              amount: amountInMajor,
              currency: data.currency,
              campaignTitle: campaignDetails.title,
            });
          }
        }
      });

      console.log(`[Paystack Webhook] Successfully processed donation for campaign ${campaignId}`);
      return NextResponse.json({ status: 'success' });
    } catch (err: any) {
      console.error('[Paystack Webhook] Database error:', err);
      // Return 500 so Paystack retries if it's a transient error
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  // Acknowledge but ignore other events
  return NextResponse.json({ status: 'ignored' });
}
