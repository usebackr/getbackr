import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
): Promise<NextResponse> {
  const { username } = params;

  const [creator] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      category: users.category,
      socialLinks: users.socialLinks,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  const creatorCampaigns = await db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      title: campaigns.title,
      status: campaigns.status,
      coverImageUrl: campaigns.coverImageUrl,
      goalAmount: campaigns.goalAmount,
      currency: campaigns.currency,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .where(
      and(eq(campaigns.creatorId, creator.id), inArray(campaigns.status, ['active', 'closed'])),
    );

  return NextResponse.json({
    username: creator.username,
    displayName: creator.displayName,
    bio: creator.bio ?? null,
    avatarUrl: creator.avatarUrl ?? null,
    category: creator.category ?? null,
    socialLinks: creator.socialLinks ?? null,
    campaigns: creatorCampaigns,
  });
}
