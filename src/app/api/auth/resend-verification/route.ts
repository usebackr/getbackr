import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { generateVerificationToken, storeVerificationToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/workers/emailWorkers';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;

  try {
    const [user] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate and store new token
    const token = generateVerificationToken();
    await storeVerificationToken(token, userId);

    // Send the email
    await sendEmail({
      type: 'verification_email',
      email: user.email,
      token: token,
    });

    return NextResponse.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('[Resend Verification] Error:', err);
    return NextResponse.json({ error: 'Failed to resend verification email' }, { status: 500 });
  }
}
