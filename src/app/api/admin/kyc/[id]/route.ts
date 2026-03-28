import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access strictly required.' },
        { status: 403 },
      );
    }

    const { action, reason } = await req.json();
    const userId = params.id;

    if (!userId)
      return NextResponse.json({ error: 'User ID is absolutely required' }, { status: 400 });

    if (action === 'verify') {
      await db
        .update(users)
        .set({ kycStatus: 'verified', kycRejectionReason: null })
        .where(eq(users.id, userId));

      return NextResponse.json({ message: 'User globally verified and withdrawals unlocked.' });
    } else if (action === 'reject') {
      if (!reason)
        return NextResponse.json(
          { error: 'Rejection reason is strictly required' },
          { status: 400 },
        );

      await db
        .update(users)
        .set({ kycStatus: 'rejected', kycRejectionReason: reason })
        .where(eq(users.id, userId));

      return NextResponse.json({
        message: 'User KYC rejected. They must strictly re-upload documents.',
      });
    } else {
      return NextResponse.json({ error: 'Invalid operation payload' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin KYC Error]', error);
    return NextResponse.json(
      { error: 'Server error structurally reviewing identity' },
      { status: 500 },
    );
  }
}
