import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const [user] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        bio: users.bio,
        category: users.category,
        username: users.username,
        avatarUrl: users.avatarUrl,
        socialLinks: users.socialLinks,
        kycStatus: users.kycStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({ user: user || null });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const body = await req.json();
    const { displayName, bio, category, username, avatarUrl, socialLinks } = body;

    await db
      .update(users)
      .set({ 
        displayName, 
        bio, 
        category, 
        username, 
        avatarUrl, 
        socialLinks,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: 'Profile updated' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
