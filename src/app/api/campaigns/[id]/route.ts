import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';

const editCampaignSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  goalAmount: z.number().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Security check: only creator can fetch draft details for editing
  if (campaign.creatorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ campaign });
}

export async function PUT(
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

  const isDraft = campaign.status?.toLowerCase() === 'draft';

  if (!isDraft && (campaign.status === 'closed' || campaign.status === 'cancelled')) {
    return NextResponse.json(
      { error: 'Cannot edit a closed or cancelled campaign' },
      { status: 422 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 422 });
  }

  const parsed = editCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errors: parsed.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 422 },
    );
  }

  const { title, category, description, coverImageUrl, goalAmount, endDate, status } = parsed.data;

  // goalAmount and endDate are only editable if it's a draft
  // If not a draft, we only allow them if the values haven't actually changed
  const hasGoalChanged = goalAmount !== undefined && Number(goalAmount) !== Number(campaign.goalAmount);
  
  const currentEndDateStr = campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '';
  const incomingEndDateStr = endDate !== undefined ? new Date(endDate).toISOString().split('T')[0] : currentEndDateStr;
  const hasEndDateChanged = endDate !== undefined && incomingEndDateStr !== currentEndDateStr;

  if (!isDraft && (hasGoalChanged || hasEndDateChanged)) {
    return NextResponse.json(
      { error: 'Funding goal and end date cannot be changed after campaign is active.' },
      { status: 422 },
    );
  }

  const updates: any = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl || null;
  if (goalAmount !== undefined) updates.goalAmount = goalAmount.toString();
  if (endDate !== undefined) updates.endDate = new Date(endDate).toISOString();
  if (status !== undefined) updates.status = status;

  const [updated] = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();

  return NextResponse.json({
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    description: updated.description,
    coverImageUrl: updated.coverImageUrl,
    status: updated.status,
    goalAmount: updated.goalAmount,
    currency: updated.currency,
    endDate: updated.endDate,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;
  const { id } = params;

  // 1. Fetch current state
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // 2. Security Check: Only creator can delete
  if (campaign.creatorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Security Check: Only draft campaigns can be deleted
  if (campaign.status?.toLowerCase() !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft campaigns can be deleted. Active campaigns are protected.' },
      { status: 403 },
    );
  }

  try {
    // 4. Perform deletion in transaction
    await db.transaction(async (tx) => {
      // First delete associated wallets (or other dependencies)
      // project_wallets refers to campaigns.id
      const { projectWallets } = await import('@/db/schema/projectWallets');
      await tx.delete(projectWallets).where(eq(projectWallets.campaignId, id));
      
      // Then delete the campaign itself
      await tx.delete(campaigns).where(eq(campaigns.id, id));
    });

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (err: any) {
    console.error('[Delete Campaign] Error:', err);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
