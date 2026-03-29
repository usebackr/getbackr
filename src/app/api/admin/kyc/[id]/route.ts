import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { notifications } from '@/db/schema/notifications';
import { eq } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { sendEmail } from '@/workers/emailWorkers';
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

    const { action, reason } = await req.json();
    const userId = params.id;

    if (!userId)
      return NextResponse.json({ error: 'User ID is absolutely required' }, { status: 400 });

    if (action === 'verify') {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await db
        .update(users)
        .set({ kycStatus: 'verified', kycRejectionReason: null })
        .where(eq(users.id, userId));

      // Notifications
      try {
        if (user?.email) {
          // In-App
          await db.insert(notifications).values({
            userId,
            type: 'kyc_status_updated',
            title: 'Identity Verified!',
            message: 'Your identity has been successfully verified. Withdrawal access is now unlocked.',
          });

          // Email
          await sendEmail({
            type: 'kyc_approved',
            email: user.email,
          });
        }
      } catch (notifyErr) {
        console.error('[Admin KYC] Notification failed:', notifyErr);
      }

      return NextResponse.json({ message: 'User globally verified and creator notified.' });
    } else if (action === 'reject') {
      if (!reason)
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 },
        );

      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await db
        .update(users)
        .set({ kycStatus: 'rejected', kycRejectionReason: reason })
        .where(eq(users.id, userId));

      // Store reason in kycProfiles too so it appears in the admin DB view
      try {
        const { kycProfiles } = await import('@/db/schema/kycProfiles');
        await db.update(kycProfiles).set({ rejectionReason: reason }).where(eq(kycProfiles.userId, userId));
      } catch { /* kycProfiles may not have the column yet pre-migration */ }

      // Notify user via email with the reason
      try {
        if (user?.email) {
          await db.insert(notifications).values({
            userId,
            type: 'kyc_status_updated',
            title: 'Verification Update',
            message: `Your KYC submission was not approved. Reason: ${reason}`,
          });

          const { sendEmail } = await import('@/workers/emailWorkers');
          await sendEmail({ type: 'kyc_rejected', email: user.email, rejectionReason: reason }).catch(
            (e) => console.error('[Admin KYC] Rejection email failed:', e)
          );
        }
      } catch (notifyErr) {
        console.error('[Admin KYC] Rejection notification failed:', notifyErr);
      }

      return NextResponse.json({ message: 'KYC rejected. User has been notified with the reason.' });
    } else {
      return NextResponse.json({ error: 'Invalid operation payload' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin KYC Error]', error);
    return NextResponse.json(
      { error: 'Server error structurally reviewing identity' },
      { status: 500 },
    );
  }
}
