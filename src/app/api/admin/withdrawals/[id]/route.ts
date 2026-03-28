import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withdrawals } from '@/db/schema/withdrawals';
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

    const { status } = await req.json();
    const withdrawalId = params.id;

    if (!withdrawalId)
      return NextResponse.json({ error: 'Withdrawal ID is absolutely required' }, { status: 400 });

    if (status === 'completed' || status === 'expired') {
      const [existingRequest] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, withdrawalId))
        .limit(1);

      if (!existingRequest)
        return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
      if (existingRequest.status !== 'processing')
        return NextResponse.json({ error: 'Payout is not in processing state' }, { status: 400 });

      // Update the payout status. Backr calculates wallet balance actively, so 'completed' confirms the payout,
      // and 'expired' effectively ghosts it out of the user's totalWithdrawn array.
      await db.update(withdrawals).set({ status }).where(eq(withdrawals.id, withdrawalId));

      const msg =
        status === 'completed'
          ? 'Funds successfully marked as physically transferred.'
          : 'Payout bounced back to Creator Wallet.';

      return NextResponse.json({ message: msg });
    } else {
      return NextResponse.json({ error: 'Invalid operation payload' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Payout Error]', error);
    return NextResponse.json({ error: 'Server error processing payout' }, { status: 500 });
  }
}
