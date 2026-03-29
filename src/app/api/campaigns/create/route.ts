import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Helper to generate a slug from the title
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

const createCampaignSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  goalAmount: z.number().min(0, 'Minimum goal is 0').optional().default(0),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'active']).optional().default('active'),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: parsed.error.errors,
        },
        { status: 422 },
      );
    }

    const { title, description, category, goalAmount, endDate, coverImageUrl, status } = parsed.data;

    // Default values for drafts
    const finalGoal = goalAmount?.toString() || '0';
    const finalEndDate = endDate 
      ? new Date(endDate).toISOString() 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
    const finalStatus = status || 'draft';

    // Generate unique slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const existing = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.slug, slug))
        .limit(1);
      if (existing.length === 0) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Insert campaign and wallet in a transaction
    const newCampaign = await db.transaction(async (tx) => {
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          creatorId: userId,
          slug,
          title,
          description: description || null,
          category: category || null,
          goalAmount: finalGoal,
          currency: 'NGN',
          endDate: finalEndDate,
          coverImageUrl: coverImageUrl || null,
          status: finalStatus as any,
        })
        .returning();

      await tx.insert(projectWallets).values({
        campaignId: campaign.id,
        currency: 'NGN',
        balance: '0',
        totalReceived: '0',
        totalWithdrawn: '0',
      });

      return campaign;
    });

    return NextResponse.json(
      {
        message: 'Campaign created successfully.',
        campaign: newCampaign,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Create Campaign] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error creating campaign' },
      { status: 500 },
    );
  }
}
