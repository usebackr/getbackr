export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { authOtps } from '@/db/schema/authOtps';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '@/workers/emailWorkers';

export async function POST(req: NextRequest) {
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

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // 2. Hash it
    const otpHash = await bcrypt.hash(otp, 10);
    
    // 3. Expire any existing un-used bank_change otps for this user to prevent confusion
    await db.update(authOtps)
      .set({ used: true })
      .where(eq(authOtps.userId, userId));

    // 4. Store it (10 minutes valid)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.insert(authOtps).values({
      userId,
      otpHash,
      purpose: 'bank_change',
      expiresAt,
    });

    // 5. Email it
    const emailResult = await sendEmail({
      type: 'bank_change_otp',
      email: user.email,
      otp,
    });

    if (!emailResult.sent) {
      console.error('[Bank Change OTP] Failed to send email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to dispatch email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verification code sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('[Bank Change OTP Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
