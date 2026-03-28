import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';
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

  if (status === 'rejected') {
    const emailQueue = getQueue(QUEUE_NAMES.EMAIL_VERIFICATION);
    await emailQueue.add({
      type: 'kyc_rejected',
      userId,
      rejectionReason: rejectionReason ?? null,
    });
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
}
