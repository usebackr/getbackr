import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema/notifications';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({ notifications: userNotifications });
  } catch (err: any) {
    console.error('[Notifications API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    // Mark all as read logic
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
