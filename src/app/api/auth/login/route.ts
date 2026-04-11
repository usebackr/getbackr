export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { rateLimit } from '@/lib/rateLimit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Max 10 login attempts per 15 minutes)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitRes = rateLimit(`login_${ip}`, 10, 15 * 60 * 1000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Find user in DB
    // Explicit selection to avoid crashes if production DB is temporarily behind schema
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        displayName: users.displayName,
        emailVerified: users.emailVerified,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.email, lowerEmail))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const dbUser = user[0];

    // REQUIRE email verification in production
    if (process.env.NODE_ENV === 'production' && !dbUser.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email verification required. Please check your inbox for the verification link.',
        },
        { status: 403 },
      );
    }

    const isValid = await verifyPassword(password, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if account is locked
    if (dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date()) {
      const secondsRemaining = Math.ceil(
        (new Date(dbUser.lockedUntil).getTime() - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: 'Account is temporarily locked due to multiple failed login attempts.',
          secondsRemaining,
        },
        { status: 423 },
      );
    }

    const accessToken = signAccessToken(dbUser.id);
    const refreshToken = signRefreshToken(dbUser.id);

    // Update last login timestamp for quick DB lookups
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, dbUser.id));

    const response = NextResponse.json({
      user: { id: dbUser.id, email: dbUser.email, displayName: dbUser.displayName },
    });

    // Track login event for analytics
    const { trackEvent } = await import('@/lib/analytics');
    await trackEvent('user_login', dbUser.id, { email: dbUser.email });

    // Set secure cookies for middleware
    const sevenDays = 7 * 24 * 60 * 60;
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sevenDays,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sevenDays,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[Login] Error:', err);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
