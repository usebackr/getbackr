import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  try {
    const [contribution] = await db
      .select({ status: contributions.status })
      .from(contributions)
      .where(eq(contributions.paymentReference, reference))
      .limit(1);

    if (!contribution) {
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({ status: contribution.status });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
