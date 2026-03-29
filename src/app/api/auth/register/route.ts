import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { hashPassword } from '@/lib/auth/password';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  beta: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const message = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Validation failed';
      return NextResponse.json(
        {
          error: message,
          errors: parsed.error.errors,
        },
        { status: 422 },
      );
    }

    const { email, password, displayName, beta } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Check if user exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, lowerEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Insert user
    const [user] = await db
      .insert(users)
      .values({
        email: lowerEmail,
        passwordHash,
        displayName,
        isBeta: !!beta,
        emailVerified: process.env.NODE_ENV !== 'production',
      })
      .returning({ id: users.id, email: users.email });

    // Track event for analytics
    const { trackEvent } = await import('@/lib/analytics');
    await trackEvent(beta ? 'beta_signup' : 'user_login', user.id, { email: user.email });

    // Send welcome email — AWAIT it to ensure Vercel doesn't cut it off before handoff
    try {
      const { sendEmail } = await import('@/workers/emailWorkers');
      await sendEmail({ type: 'welcome_email', email: user.email, displayName }).catch(
        (err) => console.error('[Register] Welcome email failed:', err)
      );
    } catch (importErr) {
      console.error('[Register] Failed to import email worker:', importErr);
    }

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === 'production'
            ? 'Registration successful. Please check your email to verify your account.'
            : 'Registration successful. You can now log in.',
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Register] Error:', err);
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Database connection refused. Please ensure PostgreSQL is running.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: err.message || 'Server error during registration' },
      { status: 500 },
    );
  }
}
