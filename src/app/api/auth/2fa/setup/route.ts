import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const authCtx = requireAuth(req);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';

  // Fetch user to get email for the OTP URI label
  const [user] = await db
    .select({ id: users.id, email: users.email, totpSecret: users.totpSecret })
    .from(users)
    .where(eq(users.id, authCtx.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Generate a new TOTP secret
  const secret = speakeasy.generateSecret({
    name: `Backr (${user.email})`,
    issuer: 'Backr',
    length: 20,
  });

  // Store the base32 secret (in production this should be encrypted at rest)
  await db
    .update(users)
    .set({ totpSecret: secret.base32, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logAuditEvent({
    eventType: '2fa_setup',
    actorId: user.id,
    metadata: { ip, userAgent },
  });

  return NextResponse.json(
    {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    },
    { status: 200 },
  );
}
