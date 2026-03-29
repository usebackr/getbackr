import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    await db.transaction(async (tx) => {
      // 1. Delete kycProfile
      await tx.delete(kycProfiles).where(eq(kycProfiles.userId, userId));
      
      // 2. Reset user kycStatus
      await tx.update(users)
        .set({ 
          kycStatus: 'unsubmitted',
          kycRejectionReason: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    });

    return NextResponse.json({ message: 'KYC status reset' });
  } catch (err) {
    console.error('[KYC Reset Error]:', err);
    return NextResponse.json({ error: 'Failed to reset KYC status' }, { status: 500 });
  }
}
