import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { passwordResets } from '@/db/schema/passwordResets';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword)
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });

    if (newPassword.length < 8)
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return await db.transaction(async (tx) => {
      const [resetRecord] = await tx
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.tokenHash, tokenHash))
        .limit(1);

      if (!resetRecord) {
        return NextResponse.json({ error: 'Invalid or missing reset token' }, { status: 400 });
      }

      if (resetRecord.used) {
        return NextResponse.json(
          { error: 'This reset token has already been used' },
          { status: 400 },
        );
      }

      if (new Date() > new Date(resetRecord.expiresAt)) {
        return NextResponse.json(
          { error: 'Reset token has expired. Please request a new one.' },
          { status: 400 },
        );
      }

      // Token validated. Hash new password and update payload security
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await tx
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetRecord.userId));

      await tx
        .update(passwordResets)
        .set({ used: true })
        .where(eq(passwordResets.id, resetRecord.id));

      return NextResponse.json({ message: 'Password reset successfully. You may now log in.' });
    });
  } catch (err: any) {
    console.error('[reset-password error]', err);
    return NextResponse.json({ error: 'Server error processing request' }, { status: 500 });
  }
}
