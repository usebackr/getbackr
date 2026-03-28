import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { spendingLogs } from '@/db/schema/spendingLogs';

// POST /api/campaigns/[id]/spending — creator only
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;
  const { id } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { description, amount, entryDate, receiptUrl } = body as {
    description: string;
    amount: number;
    entryDate: string;
    receiptUrl?: string;
  };

  if (!description || amount == null || !entryDate) {
    return NextResponse.json(
      { error: 'description, amount, and entryDate are required.' },
      { status: 422 },
    );
  }

  // Validate amount <= wallet balance
  const wallet = await db.query.projectWallets.findFirst({
    where: eq(projectWallets.campaignId, id),
  });
  if (!wallet || parseFloat(wallet.balance) < amount) {
    return NextResponse.json({ error: 'Amount exceeds current wallet balance.' }, { status: 422 });
  }

  const [entry] = await db
    .insert(spendingLogs)
    .values({
      campaignId: id,
      description,
      amount: String(amount),
      entryDate,
      receiptUrl: receiptUrl ?? null,
      deletedAt: null,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}

// GET /api/campaigns/[id]/spending — public
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;

  const entries = await db.query.spendingLogs.findMany({
    where: and(eq(spendingLogs.campaignId, id), isNull(spendingLogs.deletedAt)),
    orderBy: [desc(spendingLogs.entryDate)],
  });

  const runningTotal = entries.reduce(
    (acc: number, e: (typeof entries)[number]) => acc + parseFloat(e.amount),
    0,
  );

  return NextResponse.json({ entries, runningTotal });
}
