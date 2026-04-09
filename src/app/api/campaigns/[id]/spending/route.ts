import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { campaigns } from '@/db/schema/campaigns';
import { spendingLogs } from '@/db/schema/spendingLogs';

const spendingLogSchema = z.object({
  description: z.string().min(5),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  entryDate: z.string(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

// GET: List spending logs for a campaign
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const logs = await db
      .select()
      .from(spendingLogs)
      .where(and(eq(spendingLogs.campaignId, id), isNull(spendingLogs.deletedAt)))
      .orderBy(desc(spendingLogs.entryDate));

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch spending logs' }, { status: 500 });
  }
}

// POST: Add a new spending log
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { userId } = auth;

  // 1. Verify Ownership
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });

  if (!campaign || campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Validate Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 422 });
  }

  const parsed = spendingLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.errors }, { status: 422 });
  }

  // 3. Create Log
  try {
    const [newLog] = await db
      .insert(spendingLogs)
      .values({
        campaignId: id,
        description: parsed.data.description,
        amount: parsed.data.amount,
        entryDate: parsed.data.entryDate,
        receiptUrl: parsed.data.receiptUrl || null,
      })
      .returning();

    return NextResponse.json({ log: newLog });
  } catch (error) {
    console.error('[SpendingLog POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create spending log' }, { status: 500 });
  }
}
