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

    const { status, reason } = await req.json();
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

      if (status === 'rejected' && (!reason || reason.trim() === '')) {
         return NextResponse.json({ error: 'A rejection reason is strictly required' }, { status: 400 });
      }

      // Update the payout status
      await db.update(withdrawals).set({ 
        status, 
        rejectionReason: status === 'rejected' ? reason : null 
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
            message: `Your withdrawal for ₦${Number(existingRequest.amount).toLocaleString()} was bounced back. Reason: ${reason}`,
            metadata: JSON.stringify({ withdrawalId: existingRequest.id, amount: existingRequest.amount, reason }),
          });

          // Email
          await sendEmail({
            type: 'withdrawal_rejected',
            email: existingRequest.creatorEmail || undefined,
            amount: existingRequest.amount,
            campaignTitle: existingRequest.campaignTitle || 'Your Campaign',
            rejectionReason: reason,
          });
        }
      } catch (notifyErr) {
        console.error('[Admin Payout] Failed to notify creator:', notifyErr);
      }

      const msg =
        status === 'completed'
          ? 'Funds successfully marked as physically transferred and creator notified.'
          : `Payout marked as ${status}. Creator notified with feedback.`;

      return NextResponse.json({ message: msg });
    } else {
      return NextResponse.json({ error: 'Invalid operation payload' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Payout Error]', error);
    return NextResponse.json({ error: 'Server error processing payout' }, { status: 500 });
  }
}
