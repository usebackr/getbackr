import { NextRequest, NextResponse } from 'next/server';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { requireAuth } from '@/lib/auth/middleware';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

const createUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  body: z.string().min(1, 'Body is required').max(10000, 'Body must be 10,000 characters or fewer'),
  mediaUrl: z.string().url('mediaUrl must be a valid URL').optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: campaignId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createUpdateSchema.safeParse(body);
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

  const { title, body: updateBody, mediaUrl } = parsed.data;

  // Fetch campaign and verify ownership
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creatorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Insert campaign update
  const [update] = await db
    .insert(campaignUpdates)
    .values({
      campaignId,
      title,
      body: updateBody,
      mediaUrl: mediaUrl ?? null,
    })
    .returning();

  // Enqueue backer notification job
  const backerUpdateQueue = getQueue(QUEUE_NAMES.EMAIL_BACKER_UPDATE);
  await backerUpdateQueue.add({
    campaignId,
    updateTitle: title,
    campaignTitle: campaign.title,
  });

  return NextResponse.json(update, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id: campaignId } = params;

  const updates = await db.query.campaignUpdates.findMany({
    where: and(eq(campaignUpdates.campaignId, campaignId), isNull(campaignUpdates.deletedAt)),
    orderBy: [desc(campaignUpdates.createdAt)],
  });

  return NextResponse.json(updates);
}
