import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';
import { initializeTransaction } from '@/lib/payments/paystack';

const PLAN_PRICES: Record<string, number> = {
  monthly: 5000,
  yearly: 50000,
};

const subscriptionSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errors: parsed.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 422 },
    );
  }

  const { plan } = parsed.data;
  const price = PLAN_PRICES[plan];

  // Fetch creator for email
  const creator = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });

  if (!creator) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Create pending subscription record with placeholder dates (updated on confirmation)
  const now = new Date();
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      creatorId: auth.userId,
      plan,
      status: 'expired', // placeholder until payment confirmed
      currentPeriodStart: now,
      currentPeriodEnd: now,
    })
    .returning();

  // Initialize Paystack transaction
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/account/subscription?payment=complete`;

  let paystackResult;
  try {
    paystackResult = await initializeTransaction(
      creator.email,
      price,
      'NGN',
      { subscriptionId: subscription.id, userId: auth.userId, plan },
      callbackUrl,
    );
  } catch (err) {
    console.error('[subscriptions] Paystack initialization error:', err);
    return NextResponse.json(
      { error: 'Payment gateway unavailable. Please try again.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    paymentUrl: paystackResult.authorization_url,
    reference: paystackResult.reference,
    subscriptionId: subscription.id,
  });
}
