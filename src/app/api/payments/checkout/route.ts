import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { initializeTransaction } from '@/lib/payments/paystack';
import { verifyAccessToken } from '@/lib/auth/jwt';

const checkoutSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().min(100),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token)
      return NextResponse.json(
        { error: 'You must be logged in to back a project' },
        { status: 401 },
      );

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub as string;
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout data' }, { status: 422 });
    }

    const { campaignId, amount } = parsed.data;

    // Fetch user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch campaign details to verify it exists
    const [campaign] = await db
      .select({ id: campaigns.id, slug: campaigns.slug })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${campaign.slug}?success=true`;

    const metadata = {
      campaignId,
      backerId: userId,
      type: 'contribution',
    };

    const transaction = await initializeTransaction(
      user.email,
      amount,
      'NGN',
      metadata,
      callbackUrl,
    );

    return NextResponse.json({
      authorizationUrl: transaction.authorization_url,
      reference: transaction.reference,
    });
  } catch (err: any) {
    console.error('[Checkout API]', err);
    return NextResponse.json(
      { error: err.message || 'Payment initialization failed' },
      { status: 500 },
    );
  }
}
