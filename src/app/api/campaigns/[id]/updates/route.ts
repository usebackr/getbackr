import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { campaigns } from '@/db/schema/campaigns';
import { campaignUpdates } from '@/db/schema/campaignUpdates';

const updateSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10),
  mediaUrl: z.string().url().optional().or(z.literal('')),
});

// GET: List updates for a campaign
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const updates = await db
      .select()
      .from(campaignUpdates)
      .where(and(eq(campaignUpdates.campaignId, id), isNull(campaignUpdates.deletedAt)))
      .orderBy(desc(campaignUpdates.createdAt));

    return NextResponse.json({ updates });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

// POST: Post a new update
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.errors }, { status: 422 });
  }

  // 3. Create Update
  try {
    const [newUpdate] = await db
      .insert(campaignUpdates)
      .values({
        campaignId: id,
        title: parsed.data.title,
        body: parsed.data.body,
        mediaUrl: parsed.data.mediaUrl || null,
      })
      .returning();

    return NextResponse.json({ update: newUpdate });
  } catch (error) {
    console.error('[Update POST] Error:', error);
    return NextResponse.json({ error: 'Failed to post update' }, { status: 500 });
  }
}
