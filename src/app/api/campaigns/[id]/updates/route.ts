import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { sendBackerUpdateEmails } from '@/workers/emailWorkers';

const createUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  mediaUrl: z.string().url().optional().nullable(),
});

// GET /api/campaigns/[id]/updates
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const activeUpdates = await db.query.campaignUpdates.findMany({
      where: (table, { eq, isNull, and }) => and(eq(table.campaignId, id), isNull(table.deletedAt)),
      orderBy: [desc(campaignUpdates.createdAt)],
    });

    return NextResponse.json({ updates: activeUpdates });
  } catch (err) {
    console.error('[GetUpdates] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/updates
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const parsed = createUpdateSchema.parse(body);

    // 1. Verify campaign existence and ownership
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.creatorId !== auth.userId) {
      return NextResponse.json({ error: 'Only the creator can post updates.' }, { status: 403 });
    }

    // 2. Create the update
    const [newUpdate] = await db
      .insert(campaignUpdates)
      .values({
        campaignId: id,
        title: parsed.title,
        body: parsed.body,
        mediaUrl: parsed.mediaUrl,
      })
      .returning();

    // 3. Trigger email notifications to backers
    try {
      await sendBackerUpdateEmails({
        campaignId: id,
        updateTitle: newUpdate.title,
        campaignTitle: campaign.title,
      });
    } catch (emailErr) {
      // Don't fail the request if emails fail, just log it
      console.error('[CreateUpdate] Email notification failed:', emailErr);
    }

    return NextResponse.json({ update: newUpdate }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 422 },
      );
    }
    console.error('[CreateUpdate] Error:', err);
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
  }
}
