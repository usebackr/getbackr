import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, and, sql, ilike, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { boostPurchases } from '@/db/schema/boostPurchases';
import { getPublicUrl } from '@/lib/storage';

const SUPPORTED_CURRENCIES = ['NGN', 'KES', 'GHS', 'ZAR', 'USD'] as const;

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  goalAmount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  category: z.string().min(1).max(50).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;

  // Check KYC status
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.kycStatus !== 'verified') {
    return NextResponse.json(
      { error: 'KYC verification required to create a campaign. Please complete KYC first.' },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 422 });
  }

  const parsed = createCampaignSchema.safeParse(body);
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

  const { title, description, goalAmount, currency, category, endDate } = parsed.data;
  const slug = generateSlug(title);

  // Single DB transaction: insert campaign + project_wallet
  const result = await db.transaction(async (tx: typeof db) => {
    const [campaign] = await tx
      .insert(campaigns)
      .values({
        creatorId: userId,
        slug,
        title,
        description: description ?? null,
        category: category ?? null,
        goalAmount: goalAmount.toString(),
        currency,
        status: 'draft',
        endDate,
      })
      .returning();

    await tx.insert(projectWallets).values({
      campaignId: campaign.id,
      balance: '0',
      totalReceived: '0',
      totalWithdrawn: '0',
      currency,
    });

    return campaign;
  });

  return NextResponse.json(
    {
      id: result.id,
      slug: result.slug,
      title: result.title,
      status: result.status,
      goalAmount: result.goalAmount,
      currency: result.currency,
      endDate: result.endDate,
    },
    { status: 201 },
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q');

  // Build WHERE conditions for active campaigns
  const conditions = [eq(campaigns.status, 'active')];

  if (category) {
    conditions.push(eq(campaigns.category, category));
  }

  if (q) {
    // Full-text search using PostgreSQL tsvector / tsquery
    conditions.push(
      sql`to_tsvector('english', coalesce(${campaigns.title}, '') || ' ' || coalesce(${campaigns.description}, '')) @@ plainto_tsquery('english', ${q})`,
    );
  }

  const now = new Date();

  // Fetch all active campaigns with creator join and wallet join
  const rows = await db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      title: campaigns.title,
      description: campaigns.description,
      coverImageUrl: campaigns.coverImageUrl,
      goalAmount: campaigns.goalAmount,
      currency: campaigns.currency,
      status: campaigns.status,
      category: campaigns.category,
      createdAt: campaigns.createdAt,
      endDate: campaigns.endDate,
      creatorDisplayName: users.displayName,
      totalReceived: projectWallets.totalReceived,
    })
    .from(campaigns)
    .leftJoin(users, eq(campaigns.creatorId, users.id))
    .leftJoin(projectWallets, eq(projectWallets.campaignId, campaigns.id))
    .where(and(...conditions))
    .orderBy(desc(campaigns.createdAt));

  // Fetch active boost campaign IDs
  const activeBoostedRows = await db
    .selectDistinct({ campaignId: boostPurchases.campaignId })
    .from(boostPurchases)
    .where(and(eq(boostPurchases.status, 'active'), sql`${boostPurchases.expiresAt} > ${now}`));

  const boostedIds = new Set(activeBoostedRows.map((r) => r.campaignId));

  function buildCard(row: (typeof rows)[number]) {
    const goalAmount = parseFloat(row.goalAmount ?? '0');
    const totalReceived = parseFloat(row.totalReceived ?? '0');
    const fundingProgressPercent =
      goalAmount > 0 ? Math.min(100, (totalReceived / goalAmount) * 100) : 0;

    const endDate = new Date(row.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      creatorName: row.creatorDisplayName ?? null,
      coverImageUrl: row.coverImageUrl ?? null,
      goalAmount: row.goalAmount,
      currency: row.currency,
      status: row.status,
      category: row.category ?? null,
      createdAt: row.createdAt,
      endDate: row.endDate,
      fundingProgressPercent: parseFloat(fundingProgressPercent.toFixed(2)),
      daysRemaining,
    };
  }

  const boosted = rows.filter((r) => boostedIds.has(r.id)).map(buildCard);
  const regular = rows.filter((r) => !boostedIds.has(r.id)).map(buildCard);

  return NextResponse.json({ boosted, campaigns: regular });
}
