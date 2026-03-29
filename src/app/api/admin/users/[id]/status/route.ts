import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { trackEvent } from '@/lib/analytics';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { kycStatus, isBeta } = body;
    const userId = params.id;

    const updateData: any = {};
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus;
    if (isBeta !== undefined) updateData.isBeta = isBeta;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Log the administrative action
    await trackEvent('admin_action', userId, { 
      action: 'user_status_update', 
      updates: updateData 
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('[Admin User Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
