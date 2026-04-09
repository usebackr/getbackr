import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { projectWallets } from '@/db/schema/projectWallets';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { eq, sql } from 'drizzle-orm';
import { sendEmail } from '@/workers/emailWorkers';

export interface FulfillmentPayload {
  reference: string;
  amountInMajor: number;
  currency: string;
  customerEmail: string;
  channel: string;
  metadata: {
    campaignId?: string;
    backerId?: string | null;
    backerName?: string;
    anonymous?: boolean | string;
    message?: string | null;
    referralSource?: string | null;
    [key: string]: any;
  };
}

export async function processSuccessfulPayment(payload: FulfillmentPayload) {
  const { reference, amountInMajor, currency, customerEmail, channel, metadata } = payload;
  const campaignId = (metadata.campaignId || '').trim();
  const backerId = (metadata.backerId || '').trim();

  if (!campaignId) {
    console.warn('[Fulfillment] Missing campaignId in metadata for reference:', reference);
    return { status: 'ignored', message: 'Missing campaignId' };
  }

  const platformFee = amountInMajor * 0.05;
  const netAmount = amountInMajor - platformFee;

  try {
    console.log(`[Fulfillment] Processing success. Campaign: ${campaignId}, Reference: ${reference}`);

    const txResult = await db.transaction(async (tx) => {
      // Idempotency: skip if already processed
      const existing = await tx
        .select({ id: contributions.id })
        .from(contributions)
        .where(sql`${contributions.paymentReference} = ${reference}`)
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Fulfillment] Duplicate reference detected: ${reference}. Skipping.`);
        return null;
      }

      const isAnonymous = metadata.anonymous === true || metadata.anonymous === 'true';
      let backerName = (metadata.backerName || 'A Supporter').trim();
      const contributionMessage = (metadata.message || '').trim();
      const referralSource = (metadata.referralSource || '').trim();

      if (backerId && !isAnonymous) {
        const [backer] = await tx
          .select({ displayName: users.displayName })
          .from(users)
          .where(eq(users.id, backerId))
          .limit(1);
        if (backer) backerName = backer.displayName;
      }

      const finalBackerName = isAnonymous ? 'Anonymous Supporter' : backerName;

      console.log(`[Fulfillment] Recording contribution in database...`);

      await tx.insert(contributions).values({
        campaignId,
        backerId: backerId || null,
        backerEmail: customerEmail,
        backerName: finalBackerName,
        amount: amountInMajor.toString(),
        platformFee: platformFee.toString(),
        netAmount: netAmount.toString(),
        currency: currency || 'NGN',
        anonymous: isAnonymous,
        message: contributionMessage || null,
        paymentReference: reference,
        paymentMethod: channel || 'paystack',
        status: 'confirmed',
        referralSource: referralSource || null,
      });

      console.log(`[Fulfillment] Updating wallet for campaign: ${campaignId}`);
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
        console.warn(`[Fulfillment] No wallet found for campaign ${campaignId}. Creating one...`);
        await tx.insert(projectWallets).values({
          campaignId,
          balance: netAmount.toString(),
          totalReceived: amountInMajor.toString(),
          currency: currency || 'NGN',
        });
      } else {
        console.log(`[Fulfillment] Wallet updated successfully. New balance: ${walletUpdate[0].balance}`);
      }

      console.log(`[Fulfillment] Fetching notification details...`);
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

      const notificationData =
        campaignDetails && campaignDetails.creatorId
          ? {
              userId: campaignDetails.creatorId,
              type: 'donation_received' as const,
              title: 'New Donation Received!',
              message: `You received a donation of ${currency} ${amountInMajor.toLocaleString()} for your campaign "${campaignDetails.title}".`,
              metadata: JSON.stringify({ campaignId, amount: amountInMajor }),
            }
          : null;

      return {
        campaignDetails,
        wallet,
        backerName: finalBackerName,
        notificationData,
      };
    });

    if (txResult && txResult.campaignDetails) {
      try {
        const { campaignDetails, wallet, backerName, notificationData } = txResult;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng';

        if (notificationData) {
          const { sendAppNotification } = await import('@/lib/notifications/push');
          await sendAppNotification(
            notificationData.userId,
            notificationData.title,
            notificationData.message,
            notificationData.type,
            '/dashboard/notifications',
            notificationData.metadata,
          );
        }

        await sendEmail({
          type: 'donor_receipt',
          backerEmail: customerEmail,
          backerName: backerName,
          amount: amountInMajor,
          currency: currency,
          campaignTitle: campaignDetails.title,
          contributionId: reference,
          campaignUrl: `${appUrl}/c/${campaignDetails.slug}`,
        });

        if (campaignDetails.creatorEmail) {
          await sendEmail({
            type: 'creator_alert',
            backerEmail: campaignDetails.creatorEmail || undefined,
            amount: amountInMajor,
            currency: currency,
            campaignTitle: campaignDetails.title,
            creatorName: campaignDetails.creatorName || undefined,
            backerName: backerName,
            totalRaised: wallet?.totalReceived || netAmount,
            goalAmount: campaignDetails.goalAmount,
            campaignUrl: `${appUrl}/c/${campaignDetails.slug}`,
          });
        }
      } catch (emailErr) {
        console.error('[Fulfillment] Non-fatal error sending emails:', emailErr);
      }
    }

    console.log(`[Fulfillment] Successfully processed reference ${reference}`);
    return { status: 'success' };
  } catch (err: any) {
    console.error('[Fulfillment] Database/processing error:', err);
    throw err;
  }
}
