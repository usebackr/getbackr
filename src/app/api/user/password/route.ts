export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { authOtps } from '@/db/schema/authOtps';
import { eq, and, desc } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import bcrypt from 'bcrypt';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub as string;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { newPassword, otp } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid OTP format.' }, { status: 400 });
    }

    // 1. Find the latest password_change otp for this user
    const [latestOtp] = await db
      .select()
      .from(authOtps)
      .where(and(eq(authOtps.userId, userId), eq(authOtps.purpose, 'password_change')))
      .orderBy(desc(authOtps.createdAt))
      .limit(1);

    if (!latestOtp) {
      return NextResponse.json({ error: 'Verification code not found' }, { status: 400 });
    }

    if (latestOtp.used) {
      return NextResponse.json({ error: 'This verification code has already been used' }, { status: 400 });
    }

    if (latestOtp.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // 2. Verify OTP Match
    const match = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // 3. OTP is valid, mark as used
    await db.update(authOtps).set({ used: true }).where(eq(authOtps.id, latestOtp.id));

    // 4. Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[Password Update Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
