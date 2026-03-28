import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';

const editCampaignSchema = z.object({
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  // These are never allowed after creation — included only to detect and reject them
  goalAmount: z.number().optional(),
  endDate: z.string().optional(),
});

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

  if (campaign.status === 'closed' || campaign.status === 'cancelled') {
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

  const { description, coverImageUrl, goalAmount, endDate } = parsed.data;

  // goalAmount and endDate are never editable after creation
  if (goalAmount !== undefined || endDate !== undefined) {
    return NextResponse.json(
      { error: 'Funding goal and end date cannot be changed after campaign creation.' },
      { status: 422 },
    );
  }

  const updates: Partial<{ description: string; coverImageUrl: string; updatedAt: Date }> = {};
  if (description !== undefined) updates.description = description;
  if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl;
  updates.updatedAt = new Date();

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
