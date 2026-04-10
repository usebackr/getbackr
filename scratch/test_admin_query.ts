import { db } from './src/lib/db';
import { users } from './src/db/schema/users';
import { campaigns } from './src/db/schema/campaigns';
import { contributions } from './src/db/schema/contributions';
import { sql, eq, desc, and } from 'drizzle-orm';

async function testQuery() {
  const contributionTotals = db
    .select({
      campaignId: contributions.campaignId,
      totalRaised: sql<string>`SUM(${contributions.amount})::text`.as('totalRaised'),
    })
    .from(contributions)
    .where(eq(contributions.status, 'confirmed'))
    .groupBy(contributions.campaignId)
    .as('contributionTotals');

  try {
    const allProjects = await db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        status: campaigns.status,
        slug: campaigns.slug,
        goalAmount: campaigns.goalAmount,
        creatorName: users.displayName,
        creatorEmail: users.email,
        totalRaised: sql<string>`COALESCE(${contributionTotals.totalRaised}, '0')`,
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .leftJoin(contributionTotals, eq(campaigns.id, contributionTotals.campaignId))
      .orderBy(desc(campaigns.createdAt))
      .limit(10);
    
    console.log('Query successful, found', allProjects.length, 'projects');
  } catch (err) {
    console.error('Query failed:', err);
  }
}

testQuery();
