import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/db/schema/pushSubscriptions';
import { eq, and } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Check if the exact endpoint already exists for this user to avoid duplicates
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ message: 'Subscription already exists' });
    }

    // Save the new subscription
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return NextResponse.json({ message: 'Push subscription saved' });
  } catch (error: any) {
    console.error('[POST /api/notifications/push]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));

    return NextResponse.json({ message: 'Push subscription deleted' });
  } catch (error: any) {
    console.error('[DELETE /api/notifications/push]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
