import { NextRequest, NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { getPublicUrl } from '@/lib/storage';

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

  // Apply self-healing URLs
  const sanitizedCampaigns = creatorCampaigns.map(c => ({
    ...c,
    coverImageUrl: getPublicUrl(c.coverImageUrl)
  }));

  return NextResponse.json({
    username: creator.username,
    displayName: creator.displayName,
    bio: creator.bio ?? null,
    avatarUrl: getPublicUrl(creator.avatarUrl),
    category: creator.category ?? null,
    socialLinks: creator.socialLinks ?? null,
    campaigns: sanitizedCampaigns,
  });
}
