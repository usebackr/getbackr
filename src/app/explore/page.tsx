import React from 'react';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { eq, desc, and, sql } from 'drizzle-orm';
import { contributions } from '@/db/schema/contributions';
import ExploreClient from './ExploreClient';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  // Only fetch active campaigns for the explore page
  const activeCampaigns = await db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      title: campaigns.title,
      description: campaigns.description,
      category: campaigns.category,
      coverImageUrl: campaigns.coverImageUrl,
      goalAmount: campaigns.goalAmount,
      endDate: campaigns.endDate,
      status: campaigns.status,
      createdAt: campaigns.createdAt,
      creatorName: users.displayName,
      creatorUsername: users.username,
      creatorAvatar: users.avatarUrl,
      raised: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
      backers: sql<number>`COUNT(DISTINCT ${contributions.backerEmail})::int`,
    })
    .from(campaigns)
    .leftJoin(users, eq(users.id, campaigns.creatorId))
    .leftJoin(
      contributions,
      sql`${contributions.campaignId} = ${campaigns.id} AND ${contributions.status} = 'confirmed'`,
    )
    .where(and(eq(campaigns.status, 'active')))
    .groupBy(
      campaigns.id,
      campaigns.slug,
      campaigns.title,
      campaigns.description,
      campaigns.category,
      campaigns.coverImageUrl,
      campaigns.goalAmount,
      campaigns.endDate,
      campaigns.status,
      campaigns.createdAt,
      users.displayName,
      users.username,
      users.avatarUrl,
    )
    .orderBy(desc(campaigns.createdAt))
    .limit(40);

  return <ExploreClient initialCampaigns={activeCampaigns} />;
}
