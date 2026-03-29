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
    const backerId = (metadata.backerId || '').trim();
    const amountInKobo = data.amount;
    const amountInMajor = amountInKobo / 100;
    const reference = data.reference;

    if (!campaignId) {
      console.warn('[Paystack Webhook] Missing campaignId in metadata', reference);
      return NextResponse.json({ status: 'ignored', message: 'Missing campaignId' });
    }

    // Calculate 5% Platform Fee
    const platformFee = amountInMajor * 0.05;
    const netAmount = amountInMajor - platformFee;    try {
      console.log(`[Paystack Webhook] Processing charge.success. Campaign: ${campaignId}, Reference: ${reference}`);

      const txResult = await db.transaction(async (tx) => {
        // A. Idempotency: skip if already processed
        const existing = await tx
          .select({ id: contributions.id })
          .from(contributions)
          .where(sql`${contributions.paymentReference} = ${reference}`)
          .limit(1);

        if (existing.length > 0) {
          console.log(`[Paystack Webhook] Duplicate reference detected: ${reference}. Skipping.`);
          return null;
        }

        // B. Insert confirmed contribution
        console.log(`[Paystack Webhook] Recording contribution in database...`);
        const isAnonymous = metadata.anonymous === true || metadata.anonymous === 'true';
        
        await tx.insert(contributions).values({
          campaignId,
          backerId: backerId || null,
          backerEmail: data.customer.email,
          amount: amountInMajor.toString(),
          platformFee: platformFee.toString(),
          netAmount: netAmount.toString(),
          currency: data.currency || 'NGN',
          anonymous: isAnonymous,
          paymentReference: reference,
          paymentMethod: data.channel || 'paystack',
          status: 'confirmed',
        });

        // C. Update campaign's project wallet (atomic increment)
        console.log(`[Paystack Webhook] Updating wallet for campaign: ${campaignId}`);
        // Use explicit numeric addition to be 100% sure with Postgres
        const walletUpdate = await tx
          .update(projectWallets)
          .set({
            balance: sql`${projectWallets.balance} + ${netAmount}::numeric`,
            totalReceived: sql`${projectWallets.totalReceived} + ${amountInMajor}::numeric`,
            updatedAt: new Date(),
          })
          .where(eq(projectWallets.campaignId, campaignId))
          .returning({ id: projectWallets.id, balance: projectWallets.balance });

        if (walletUpdate.length === 0) {
          console.warn(`[Paystack Webhook] No wallet found for campaign ${campaignId}. Creating one for tracking...`);
          await tx.insert(projectWallets).values({
            campaignId,
            balance: netAmount.toString(),
            totalReceived: amountInMajor.toString(),
            currency: data.currency || 'NGN',
          });
        } else {
          console.log(`[Paystack Webhook] Wallet updated successfully. New recorded balance: ${walletUpdate[0].balance}`);
        }

        // D. Fetch campaign creator details and current wallet state
        console.log(`[Paystack Webhook] Fetching notification details...`);
        const [campaignDetails] = await tx
          .select({
            title: campaigns.title,
            slug: campaigns.slug,
            goalAmount: campaigns.goalAmount,
            creatorId: campaigns.creatorId,
            creatorEmail: users.email,
            creatorName: users.displayName,
          })
          .from(campaigns)
          .leftJoin(users, eq(users.id, campaigns.creatorId))
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        const [wallet] = await tx
          .select({ totalReceived: projectWallets.totalReceived })
          .from(projectWallets)
          .where(eq(projectWallets.campaignId, campaignId))
          .limit(1);

        let backerName = isAnonymous ? 'Anonymous Supporter' : (metadata.backerName || 'A Supporter');
        if (backerId && !isAnonymous) {
          const [backer] = await tx
            .select({ displayName: users.displayName })
            .from(users)
            .where(eq(users.id, backerId))
            .limit(1);
          if (backer) backerName = backer.displayName;
        }

        if (campaignDetails) {
          // E. Create internal notification for creator
          await tx.insert(notifications).values({
            userId: campaignDetails.creatorId,
            type: 'donation_received',
            title: 'New Donation Received!',
            message: `You received a donation of ${data.currency} ${amountInMajor.toLocaleString()} for your campaign "${campaignDetails.title}".`,
            metadata: JSON.stringify({ campaignId, amount: amountInMajor }),
          });
        }
        
        return {
          campaignDetails,
          wallet,
          backerName
        };
      });

      // F. Queue Emails via Workers (OUTSIDE THE DB TRANSACTION!)
      // Doing it outside the transaction ensures the payment is safely recorded.
      if (txResult && txResult.campaignDetails && process.env.REDIS_URL) {
        try {
          const { campaignDetails, wallet, backerName } = txResult;
          const emailQueue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backr.app';

          // Email to Donor (Receipt)
          await emailQueue.add({
            type: 'donor_receipt',
            backerEmail: data.customer.email,
            backerName: backerName,
            amount: amountInMajor,
            currency: data.currency,
            campaignTitle: campaignDetails.title,
            contributionId: reference,
            campaignUrl: `${appUrl}/c/${campaignDetails.slug}`,
          }, { timeout: 5000 }); // strict timeout

          // Email to Creator (Alert)
          if (campaignDetails.creatorEmail) {
            await emailQueue.add({
              type: 'creator_alert',
              backerEmail: campaignDetails.creatorEmail,
              amount: amountInMajor,
              currency: data.currency,
              campaignTitle: campaignDetails.title,
              creatorName: campaignDetails.creatorName,
              backerName: backerName,
              totalRaised: wallet?.totalReceived || netAmount,
              goalAmount: campaignDetails.goalAmount,
              campaignUrl: `${appUrl}/c/${campaignDetails.slug}`,
            }, { timeout: 5000 });
          }
        } catch (queueErr) {
          console.error('[Paystack Webhook] Non-fatal error queueing emails:', queueErr);
        }
      }

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
