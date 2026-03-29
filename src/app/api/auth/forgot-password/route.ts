import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { passwordResets } from '@/db/schema/passwordResets';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return a generic success message to prevent malicious email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute expiration window

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send the email directly (awaited for Vercel reliability)
    try {
      const { sendEmail } = await import('@/workers/emailWorkers');
      await sendEmail({
        type: 'forgot_password',
        email: user.email,
        token,
      });
    } catch (emailErr) {
      console.error('[forgot-password] Email failed:', emailErr);
      // We still return success to the user so we don't leak information
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err: any) {
    console.error('[forgot-password error]', err);
    return NextResponse.json({ error: 'Server error processing request' }, { status: 500 });
  }
}
