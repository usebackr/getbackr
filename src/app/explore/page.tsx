import React from 'react';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { users } from '@/db/schema/users';
import { eq, desc, and } from 'drizzle-orm';
import ExploreClient from './ExploreClient';
import { getPublicUrl } from '@/lib/storage';

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
      raised: projectWallets.totalReceived,
    })
    .from(campaigns)
    .leftJoin(users, eq(users.id, campaigns.creatorId))
    .leftJoin(projectWallets, eq(projectWallets.campaignId, campaigns.id))
    .where(and(eq(campaigns.status, 'active')))
    .orderBy(desc(campaigns.createdAt))
    .limit(40);

  return <ExploreClient initialCampaigns={activeCampaigns} />;
}
