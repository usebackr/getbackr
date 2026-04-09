import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import { spendingLogs } from '@/db/schema/spendingLogs';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { bankAccounts } from '@/db/schema/bankAccounts';
import { notifications } from '@/db/schema/notifications';
import { passwordResets } from '@/db/schema/passwordResets';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { auditLogs } from '@/db/schema/auditLogs';
import { emailCampaigns } from '@/db/schema/emailCampaigns';
import { emailContacts } from '@/db/schema/emailContacts';
import { subscriptions } from '@/db/schema/subscriptions';
import { eq, inArray, or } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const userId = params.id;

    // 1. Get user details for the final email notification
    const [user] = await db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get all campaign IDs owned by this user
    const userCampaigns = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.creatorId, userId));

    const campaignIds = userCampaigns.map((c) => c.id);

    // 3. Perform Cascading Deletion in a Transaction
    await db.transaction(async (tx) => {
      // A. Delete Campaign-specific children
      if (campaignIds.length > 0) {
        // Get wallet IDs to clean up withdrawals properly if they aren't linked by creatorId
        const wallets = await tx
          .select({ id: projectWallets.id })
          .from(projectWallets)
          .where(inArray(projectWallets.campaignId, campaignIds));
        const walletIds = wallets.map((w) => w.id);

        await tx.delete(campaignUpdates).where(inArray(campaignUpdates.campaignId, campaignIds));
        await tx.delete(spendingLogs).where(inArray(spendingLogs.campaignId, campaignIds));
        await tx.delete(boostPurchases).where(inArray(boostPurchases.campaignId, campaignIds));
        await tx.delete(emailCampaigns).where(inArray(emailCampaigns.campaignId, campaignIds));

        if (walletIds.length > 0) {
          await tx.delete(withdrawals).where(inArray(withdrawals.walletId, walletIds));
        }

        await tx.delete(projectWallets).where(inArray(projectWallets.campaignId, campaignIds));
      }

      // B. Delete Contributions (both where user is backer OR campaign belongs to user)
      if (campaignIds.length > 0) {
        await tx
          .delete(contributions)
          .where(
            or(eq(contributions.backerId, userId), inArray(contributions.campaignId, campaignIds)),
          );
      } else {
        await tx.delete(contributions).where(eq(contributions.backerId, userId));
      }

      // C. Delete Direct User dependencies
      await tx.delete(withdrawals).where(eq(withdrawals.creatorId, userId));
      await tx.delete(kycProfiles).where(eq(kycProfiles.userId, userId));
      await tx.delete(bankAccounts).where(eq(bankAccounts.userId, userId));
      await tx.delete(notifications).where(eq(notifications.userId, userId));
      await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));
      await tx.delete(emailContacts).where(eq(emailContacts.creatorId, userId));
      await tx.delete(subscriptions).where(eq(subscriptions.creatorId, userId));
      await tx.delete(emailCampaigns).where(eq(emailCampaigns.creatorId, userId));

      // D. Clean up Audit Logs (set actor to null instead of deleting logs if preferred, but for test accounts we wipe)
      await tx.delete(auditLogs).where(eq(auditLogs.actorId, userId));

      // E. Delete Campaigns
      if (campaignIds.length > 0) {
        await tx.delete(campaigns).where(inArray(campaigns.id, campaignIds));
      }

      // F. Final User Removal
      await tx.delete(users).where(eq(users.id, userId));
    });

    // 4. Send Email Notification (Try-catch so it doesn't block the API response if email fails)
    try {
      const { sendEmail } = await import('@/workers/emailWorkers');
      await sendEmail({
        type: 'account_deleted',
        email: user.email,
        displayName: user.displayName,
      });
    } catch (emailErr) {
      console.error('[AdminDeleteUser] Notification failed:', emailErr);
    }

    return NextResponse.json({ message: 'User and all associated data permanently deleted.' });
  } catch (err: any) {
    console.error('[AdminDeleteUser] Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete user. Database transaction failed.' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const userId = params.id;
    const { kycStatus, kycRejectionReason, isBeta } = await req.json();

    if (kycStatus === undefined && isBeta === undefined) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    // 1. Get user details for the email notification
    const [user] = await db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Update user status in a transaction
    await db.transaction(async (tx) => {
      const updatePayload: any = { updatedAt: new Date() };
      
      if (kycStatus !== undefined) {
        updatePayload.kycStatus = kycStatus;
        updatePayload.kycRejectionReason = kycRejectionReason || null;
      }
      
      if (isBeta !== undefined) {
        updatePayload.isBeta = !!isBeta;
      }

      await tx
        .update(users)
        .set(updatePayload)
        .where(eq(users.id, userId));

      // Also update the kycProfiles record if KYC status changed to keep them in sync
      if (kycStatus !== undefined) {
        await tx
          .update(kycProfiles)
          .set({
            rejectionReason: kycRejectionReason || null,
            updatedAt: new Date(),
          })
          .where(eq(kycProfiles.userId, userId));
      }
    });

    // 3. Trigger Email Notification (if revoking verification)
    // Only send if the status is being set to something indicative of revocation from a previously good state
    // We target 'rejected' or 'unsubmitted' here as per user request
    if (kycStatus === 'rejected' || kycStatus === 'unsubmitted') {
      try {
        const { sendEmail } = await import('@/workers/emailWorkers');
        await sendEmail({
          type: 'kyc_revoked',
          email: user.email,
          displayName: user.displayName,
          rejectionReason: kycRejectionReason,
        });
      } catch (emailErr) {
        console.error('[AdminUpdateKYC] Notification failed:', emailErr);
      }
    }

    return NextResponse.json({
      message: `User KYC status updated to ${kycStatus} successfully.`,
      userId,
      kycStatus,
    });
  } catch (err: any) {
    console.error('[AdminUpdateKYC] Error:', err);
    return NextResponse.json({ error: 'Failed to update user KYC status.' }, { status: 500 });
  }
}
