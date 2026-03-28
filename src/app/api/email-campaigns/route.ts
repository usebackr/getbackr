import { NextRequest, NextResponse } from 'next/server';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { emailCampaigns } from '@/db/schema/emailCampaigns';
import { requirePremium } from '@/lib/middleware/premiumGuard';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

const DAILY_SEND_LIMIT = 10_000;

const createEmailCampaignSchema = z.object({
  campaignId: z.string().uuid().optional(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(255, 'Subject must be 255 characters or fewer'),
  bodyHtml: z.string().min(1, 'Body HTML is required'),
  recipientSource: z.enum(['backers', 'imported', 'both']),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const result = await requirePremium(req);
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createEmailCampaignSchema.safeParse(body);
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

  const { campaignId, subject, bodyHtml, recipientSource } = parsed.data;

  // Check daily send limit: sum of sent_count for emails sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyTotalResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${emailCampaigns.sentCount}), 0)` })
    .from(emailCampaigns)
    .where(
      sql`${emailCampaigns.creatorId} = ${userId}
        AND ${emailCampaigns.sentAt} >= ${today}`,
    );

  const dailyTotal = Number(dailyTotalResult[0]?.total ?? 0);

  if (dailyTotal >= DAILY_SEND_LIMIT) {
    return NextResponse.json(
      { error: 'Daily email send limit of 10,000 reached. Try again tomorrow.' },
      { status: 429 },
    );
  }

  // Insert email campaign record
  const [emailCampaign] = await db
    .insert(emailCampaigns)
    .values({
      creatorId: userId,
      campaignId: campaignId ?? null,
      subject,
      bodyHtml,
      recipientSource,
      status: 'sending',
    })
    .returning();

  // Enqueue send job
  const emailCampaignQueue = getQueue(QUEUE_NAMES.EMAIL_CAMPAIGN);
  await emailCampaignQueue.add({ emailCampaignId: emailCampaign.id });

  return NextResponse.json(emailCampaign, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const result = await requirePremium(req);
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const campaigns = await db.query.emailCampaigns.findMany({
    where: eq(emailCampaigns.creatorId, userId),
    orderBy: [desc(emailCampaigns.createdAt)],
  });

  const campaignsWithRates = campaigns.map((c: (typeof campaigns)[number]) => ({
    ...c,
    openRate: c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 10000) / 100 : 0,
    clickRate: c.sentCount > 0 ? Math.round((c.clickCount / c.sentCount) * 10000) / 100 : 0,
  }));

  return NextResponse.json(campaignsWithRates);
}
