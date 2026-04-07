export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/db/schema/withdrawals';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { campaigns } from '@/db/schema/campaigns';
import { notifications } from '@/db/schema/notifications';
import { sendEmail } from '@/workers/emailWorkers';
import { eq } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

import { initiateTransfer } from '@/lib/payments/paystack';
import { sql, and, inArray } from 'drizzle-orm';
import { contributions } from '@/db/schema/contributions';

export async function GET(req: NextRequest, { params }: { params: { id: string } } ) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const withdrawalId = params.id;

    // Fetch detailed withdrawal info with campaign and wallet context
    const [request] = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        reason: withdrawals.reason,
        accountNumber: withdrawals.accountNumber,
        bankCode: withdrawals.bankCode,
        accountName: withdrawals.accountName,
        createdAt: withdrawals.createdAt,
        creatorName: users.displayName,
        campaignTitle: campaigns.title,
        campaignId: campaigns.id,
        walletId: projectWallets.id,
      })
      .from(withdrawals)
      .leftJoin(users, eq(users.id, withdrawals.creatorId))
      .leftJoin(projectWallets, eq(projectWallets.id, withdrawals.walletId))
      .leftJoin(campaigns, eq(campaigns.id, projectWallets.campaignId))
      .where(eq(withdrawals.id, withdrawalId))
      .limit(1);

    if (!request) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

    if (!request.campaignId || !request.walletId) {
      return NextResponse.json({ error: 'Incomplete project data' }, { status: 400 });
    }

    // Calculate live financial context for the admin
    const [contribStats] = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
        totalPlatformFee: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
      })
      .from(contributions)
      .where(and(eq(contributions.campaignId, request.campaignId), eq(contributions.status, 'confirmed')));

    const [withdrawalStats] = await db
      .select({
        totalWithdrawn: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)::numeric`,
      })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.walletId, request.walletId),
          inArray(withdrawals.status, ['completed']), // only count already finished ones
        ),
      );

    const totalRaised = Number(contribStats?.totalAmount || 0);
    const platformFees = Number(contribStats?.totalPlatformFee || 0);
    const totalWithdrawn = Number(withdrawalStats?.totalWithdrawn || 0);
    const currentBalance = totalRaised - platformFees - totalWithdrawn;
    const remainingAfter = currentBalance - Number(request.amount);

    return NextResponse.json({
      ...request,
      financials: {
        totalRaised,
        platformFees,
        totalWithdrawn,
        currentBalance,
        remainingAfter,
      }
    });

  } catch (err) {
    console.error('[Admin Withdrawal GET Error]', err);
    return NextResponse.json({ error: 'Failed to fetch withdrawal details' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access strictly required.' },
        { status: 403 },
      );
    }

    const { status, reason: feedbackReason, isManual } = await req.json();
    const withdrawalId = params.id;

    if (!withdrawalId)
      return NextResponse.json({ error: 'Withdrawal ID is absolutely required' }, { status: 400 });

    if (status === 'completed' || status === 'rejected' || status === 'expired') {
      const [existingRequest] = await db
        .select({
          id: withdrawals.id,
          status: withdrawals.status,
          amount: withdrawals.amount,
          creatorId: withdrawals.creatorId,
          walletId: withdrawals.walletId,
          accountNumber: withdrawals.accountNumber,
          bankCode: withdrawals.bankCode,
          accountName: withdrawals.accountName,
          reason: withdrawals.reason,
          creatorEmail: users.email,
          campaignTitle: campaigns.title,
        })
        .from(withdrawals)
        .leftJoin(users, eq(users.id, withdrawals.creatorId))
        .leftJoin(projectWallets, eq(projectWallets.id, withdrawals.walletId))
        .leftJoin(campaigns, eq(campaigns.id, projectWallets.campaignId))
        .where(eq(withdrawals.id, withdrawalId))
        .limit(1);

      if (!existingRequest)
        return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
      if (existingRequest.status !== 'processing')
        return NextResponse.json({ error: 'Payout is not in processing state' }, { status: 400 });

      if (status === 'rejected' && (!feedbackReason || feedbackReason.trim() === '')) {
         return NextResponse.json({ error: 'A rejection reason is strictly required' }, { status: 400 });
      }

      let payoutReference = null;

      // Actual physical transfer via Paystack if approved
      if (status === 'completed') {
        if (isManual) {
          payoutReference = `MANUAL_PAYOUT_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7).toUpperCase()}`;
        } else {
          try {
            // 1. Create Transfer Recipient if needed (Paystack handles existing nuban gracefully)
            const { createTransferRecipient } = await import('@/lib/payments/paystack');
            const recipientCode = await createTransferRecipient(
              existingRequest.accountName || 'Creator',
              existingRequest.accountNumber || '',
              existingRequest.bankCode || ''
            );

            // 2. Initiate the Transfer
            payoutReference = await initiateTransfer(
              Number(existingRequest.amount),
              recipientCode,
              `Backr Cloud Payout: ${existingRequest.campaignTitle}`
            );
          } catch (paystackErr: any) {
            console.error('[Admin Payout] Paystack Transfer Failed:', paystackErr);
            return NextResponse.json({ 
              error: `Paystack Payout Failed: ${paystackErr.message}. Funds not moved.` 
            }, { status: 500 });
          }
        }
      }

      // Update the payout status in DB
      await db.update(withdrawals).set({ 
        status, 
        rejectionReason: status === 'rejected' ? feedbackReason : null,
        payoutReference: payoutReference
      }).where(eq(withdrawals.id, withdrawalId));

      // Trigger Email & In-App Notification
      try {
        if (status === 'completed') {
          // In-App
          await db.insert(notifications).values({
            userId: existingRequest.creatorId,
            type: 'payout_processed',
            title: 'Withdrawal Approved!',
            message: `Your request for ₦${Number(existingRequest.amount).toLocaleString()} has been processed and and transfer has been initiated.`,
            metadata: JSON.stringify({ withdrawalId: existingRequest.id, amount: existingRequest.amount }),
          });

          // Email
          await sendEmail({
            type: 'payment_approved',
            email: existingRequest.creatorEmail || undefined,
            amount: existingRequest.amount,
            campaignTitle: existingRequest.campaignTitle || 'Your Campaign',
          });
        } else if (status === 'rejected') {
          // In-App
          await db.insert(notifications).values({
            userId: existingRequest.creatorId,
            type: 'payout_processed',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal for ₦${Number(existingRequest.amount).toLocaleString()} was bounced back. Reason: ${feedbackReason}`,
            metadata: JSON.stringify({ withdrawalId: existingRequest.id, amount: existingRequest.amount, reason: feedbackReason }),
          });

          // Email
          await sendEmail({
            type: 'withdrawal_rejected',
            email: existingRequest.creatorEmail || undefined,
            amount: existingRequest.amount,
            campaignTitle: existingRequest.campaignTitle || 'Your Campaign',
            rejectionReason: feedbackReason,
          });
        }
      } catch (notifyErr) {
        console.error('[Admin Payout] Failed to notify creator:', notifyErr);
      }

      const msg =
        status === 'completed'
          ? `Funds successfully transferred via Paystack (Ref: ${payoutReference}) and creator notified.`
          : `Payout marked as ${status}. Creator notified with feedback.`;

      return NextResponse.json({ message: msg, payoutReference });
    } else {
      return NextResponse.json({ error: 'Invalid operation payload' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Payout Error]', error);
    return NextResponse.json({ error: 'Server error processing payout' }, { status: 500 });
  }
}
