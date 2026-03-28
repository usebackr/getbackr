import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

const verifySchema = z.object({
  code: z.string().min(6, 'TOTP code must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  const authCtx = requireAuth(req);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errors: [{ field: 'body', message: 'Invalid JSON' }] },
      { status: 422 },
    );
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: z.ZodIssue) => ({
      field: e.path.join('.') || 'unknown',
      message: e.message,
    }));
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { code } = parsed.data;

  const [user] = await db
    .select({ id: users.id, totpSecret: users.totpSecret })
    .from(users)
    .where(eq(users.id, authCtx.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.totpSecret) {
    return NextResponse.json(
      { error: '2FA is not set up for this account. Call /api/auth/2fa/setup first.' },
      { status: 400 },
    );
  }

  const valid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired TOTP code' }, { status: 401 });
  }

  return NextResponse.json({ message: '2FA verified successfully' }, { status: 200 });
}
