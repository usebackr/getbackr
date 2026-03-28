import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { requireAuth } from '@/lib/auth/middleware';
import { initializeTransaction } from '@/lib/payments/paystack';

// Minimum contribution amounts per currency (in major units)
const MINIMUM_AMOUNTS: Record<string, number> = {
  NGN: 500,
  KES: 65,
  GHS: 30,
  ZAR: 90,
  USD: 5,
};

const SUPPORTED_CURRENCIES = Object.keys(MINIMUM_AMOUNTS);

const contributeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z
    .string()
    .toUpperCase()
    .refine((c: string) => SUPPORTED_CURRENCIES.includes(c), {
      message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
    }),
  email: z.string().email('A valid email is required for receipt delivery'),
  anonymous: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  // Auth is optional — guests can contribute with just an email
  const auth = requireAuth(req);
  const { id: campaignId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = contributeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errors: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 422 },
    );
  }

  const { amount, currency, email, anonymous } = parsed.data;

  // Validate minimum contribution amount
  const minAmount = MINIMUM_AMOUNTS[currency];
  if (amount < minAmount) {
    return NextResponse.json(
      {
        errors: [
          {
            field: 'amount',
            message: `Minimum contribution for ${currency} is ${minAmount}`,
          },
        ],
      },
      { status: 422 },
    );
  }

  // Fetch campaign and verify it is active
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.status !== 'active') {
    return NextResponse.json(
      {
        error: `Contributions are only accepted for active campaigns. Campaign status: ${campaign.status}`,
      },
      { status: 422 },
    );
  }

  // Initialize Paystack transaction
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/campaigns/${campaign.slug}?contribution=complete`;

  const metadata: Record<string, unknown> = {
    campaignId,
    backerEmail: email,
    anonymous,
  };
  if (auth?.userId) {
    metadata.backerUserId = auth.userId;
  }

  let paystackResult;
  try {
    paystackResult = await initializeTransaction(email, amount, currency, metadata, callbackUrl);
  } catch (err) {
    console.error('[contribute] Paystack initialization error:', err);
    return NextResponse.json(
      { error: 'Payment gateway unavailable. Please try again.' },
      { status: 503 },
    );
  }

  // Insert a pending contribution record
  await db.insert(contributions).values({
    campaignId,
    backerId: auth?.userId ?? null,
    backerEmail: email,
    amount: String(amount),
    platformFee: '0',
    netAmount: '0',
    currency,
    anonymous,
    paymentReference: paystackResult.reference,
    status: 'pending',
  });

  return NextResponse.json(
    {
      paymentUrl: paystackResult.authorization_url,
      reference: paystackResult.reference,
    },
    { status: 200 },
  );
}
