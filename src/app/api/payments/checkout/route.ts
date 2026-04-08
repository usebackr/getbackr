export const dynamic = 'force-dynamic';
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
  email: z.string().email().optional(),
  name: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  shareDetails: z.boolean().optional(),
  message: z.string().optional().nullable(),
  referralSource: z.string().optional().nullable(),
});

import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Max 20 checkout attempts per 10 minutes)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitRes = rateLimit(`checkout_${ip}`, 20, 10 * 60 * 1000);
    if (!limitRes.success) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
    }

    const token = req.cookies.get('accessToken')?.value;
    let userId: string | null = null;
    let email: string | null = null;
    let name: string | null = null;

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        userId = payload.sub as string;
        
        // Fetch user email from DB if logged in
        const [user] = await db
          .select({ email: users.email, displayName: users.displayName })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (user) {
          email = user.email;
          name = user.displayName;
        }
      } catch (err) {
        console.error('[Checkout API] Token verification failed:', err);
        // Fallback to guest if token is invalid or expired
      }
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout data' }, { status: 422 });
    }

    const { campaignId, amount, isAnonymous, shareDetails, message, referralSource } = parsed.data;
    
    // If not logged in, we must have an email from the body
    if (!userId) {
      email = parsed.data.email || null;
      name = parsed.data.name || null;
      if (!email) {
        return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 });
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // Fetch campaign details to verify it exists
    const [campaign] = await db
      .select({ id: campaigns.id, slug: campaigns.slug, status: campaigns.status })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.status === 'closed') return NextResponse.json({ error: 'Campaign is permanently closed and no longer accepts contributions.' }, { status: 400 });

    const origin = req.headers.get('origin') || req.headers.get('referer');
    const appUrl = (origin && !origin.includes('localhost:3000')) 
      ? new URL(origin).origin 
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    const callbackUrl = `${appUrl}/c/${campaign.slug}/success`;

    console.log(`[Checkout API] Redirecting to: ${callbackUrl}`);

    const metadata = {
      campaignId,
      backerId: userId, // null for guests
      backerName: name || 'A Supporter',
      backerEmail: email,
      anonymous: isAnonymous || false,
      shareDetails: shareDetails ?? true,
      message: message || null,
      referralSource: referralSource || null,
      type: 'contribution',
    };
    
    console.log(`[Checkout API] Initializing for ${email} (${name || 'Guest'})`);

    const transaction = await initializeTransaction(
      email,
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
