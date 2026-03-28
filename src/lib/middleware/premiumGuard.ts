import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * Checks that the authenticated user has an active premium subscription.
 * Returns null if premium access is granted, or a 403 NextResponse if not.
 */
export async function requirePremium(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
    columns: { premiumStatus: true },
  });

  if (!user || user.premiumStatus !== 'active') {
    return NextResponse.json(
      {
        error: 'Premium subscription required',
        upgradeUrl: '/pricing',
      },
      { status: 403 },
    );
  }

  return { userId: auth.userId };
}
