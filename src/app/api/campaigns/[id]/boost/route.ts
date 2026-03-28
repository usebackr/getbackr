import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';
import { initializeTransaction } from '@/lib/payments/paystack';

const BOOST_TIERS = {
  basic: { price: 1500, durationDays: 3 },
  standard: { price: 3000, durationDays: 7 },
  premium: { price: 6000, durationDays: 14 },
} as const;

const boostSchema = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: campaignId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = boostSchema.safeParse(body);
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

  const { tier } = parsed.data;

  // Fetch campaign and verify ownership + active status
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creatorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (campaign.status !== 'active') {
    return NextResponse.json(
      { error: 'Boost can only be purchased for active campaigns' },
      { status: 422 },
    );
  }

  const tierConfig = BOOST_TIERS[tier as keyof typeof BOOST_TIERS];

  // Create pending boost_purchase record
  const [boostPurchase] = await db
    .insert(boostPurchases)
    .values({
      campaignId,
      tier,
      priceAmount: String(tierConfig.price),
      currency: 'NGN',
      status: 'pending',
    })
    .returning();

  // Initialize Paystack transaction
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/campaigns/${campaign.slug}?boost=complete`;

  // Fetch creator email for Paystack
  const creator = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  let paystackResult;
  try {
    paystackResult = await initializeTransaction(
      creator.email,
      tierConfig.price,
      'NGN',
      { campaignId, tier, boostPurchaseId: boostPurchase.id },
      callbackUrl,
    );
  } catch (err) {
    console.error('[boost] Paystack initialization error:', err);
    return NextResponse.json(
      { error: 'Payment gateway unavailable. Please try again.' },
      { status: 503 },
    );
  }

  // Store payment reference
  await db
    .update(boostPurchases)
    .set({ paymentReference: paystackResult.reference })
    .where(eq(boostPurchases.id, boostPurchase.id));

  return NextResponse.json({
    paymentUrl: paystackResult.authorization_url,
    reference: paystackResult.reference,
    boostPurchaseId: boostPurchase.id,
  });
}
