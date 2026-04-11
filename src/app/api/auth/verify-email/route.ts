import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { consumeVerificationToken } from '@/lib/auth/tokens';
import { verifyAccessToken } from '@/lib/auth/jwt';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errors: [{ field: 'body', message: 'Invalid JSON' }] },
      { status: 422 },
    );
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: z.ZodIssue) => ({
      field: e.path.join('.') || 'unknown',
      message: e.message,
    }));
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { token } = parsed.data;

  const userId = await consumeVerificationToken(token);
  if (!userId) {
    return NextResponse.json(
      { errors: [{ field: 'token', message: 'Invalid or expired verification token' }] },
      { status: 422 },
    );
  }

  // Update verification status
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const response = NextResponse.json(
    {
      message: 'Email verified successfully.',
      redirect: '/onboarding',
    },
    { status: 200 },
  );

  // SESSION HARDENING: 
  // If the user is already logged in as a DIFFERENT user, clear their cookies
  const currentToken = req.cookies.get('accessToken')?.value;
  if (currentToken) {
    try {
      const payload = verifyAccessToken(currentToken);
      if (payload && payload.sub !== userId) {
        console.log(`[Verify] Session mismatch detected. Clearing old session for ${payload.sub} (verifying ${userId})`);
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
      }
    } catch (err) {
      // If token is invalid anyway, clear it for safety
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
    }
  }

  return response;
}
