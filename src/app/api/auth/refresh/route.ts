import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  getRefreshTokenUserId,
  invalidateRefreshToken,
  storeRefreshToken,
} from '@/lib/auth/jwt';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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

  const parsed = refreshSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: z.ZodIssue) => ({
      field: e.path.join('.') || 'unknown',
      message: e.message,
    }));
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { refreshToken } = parsed.data;

  // Verify JWT signature and type
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  if (payload.type !== 'refresh') {
    return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
  }

  // Verify token exists in Redis (not invalidated)
  const storedUserId = await getRefreshTokenUserId(refreshToken);
  if (!storedUserId || storedUserId !== payload.sub) {
    return NextResponse.json({ error: 'Refresh token has been revoked' }, { status: 401 });
  }

  // Rotate: invalidate old, issue new pair
  await invalidateRefreshToken(refreshToken);

  const newAccessToken = signAccessToken(payload.sub);
  const newRefreshToken = signRefreshToken(payload.sub);
  await storeRefreshToken(newRefreshToken, payload.sub);

  return NextResponse.json(
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    { status: 200 },
  );
}
