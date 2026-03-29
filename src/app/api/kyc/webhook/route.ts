import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { notifications } from '@/db/schema/notifications';
import { sendEmail } from '@/workers/emailWorkers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const webhookBodySchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-kyc-webhook-secret');
  if (!secret || secret !== process.env.KYC_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = webhookBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
      { status: 422 },
    );
  }

  const { userId, status, rejectionReason } = parsed.data;

  await db
    .update(users)
    .set({
      kycStatus: status,
      kycRejectionReason: status === 'rejected' ? (rejectionReason ?? null) : null,
    })
    .where(eq(users.id, userId));

  // Notifications
  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (status === 'verified') {
      // In-App
      await db.insert(notifications).values({
        userId,
        type: 'kyc_status_updated',
        title: 'Identity Verified!',
        message: 'Your identity has been successfully verified. Withdrawal access is now unlocked.',
      });

      // Email
      if (user?.email) {
        await sendEmail({
          type: 'kyc_approved',
          email: user.email,
        });
      }
    } else if (status === 'rejected') {
      const reason = rejectionReason ?? 'Please re-upload clearer documents.';
      
      // In-App
      await db.insert(notifications).values({
        userId,
        type: 'kyc_status_updated',
        title: 'Verification Failed',
        message: `Your identity verification failed. Reason: ${reason}`,
        metadata: JSON.stringify({ reason }),
      });

      // Email
      if (user?.email) {
        await sendEmail({
          type: 'kyc_rejected',
          email: user.email,
          rejectionReason: reason,
        });
      }
    }
  } catch (notifyErr) {
    console.error('[KYC Webhook] Notification failed:', notifyErr);
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
}
