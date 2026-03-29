import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const [user] = await db
      .select({ id: users.id, name: users.displayName, email: users.email, avatar: users.avatarUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false });
  }
}
