import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { contributions } from '@/db/schema/contributions';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Daily Signups
    const dailySignups = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${users.createdAt})`,
        count: sql<number>`COUNT(*)::int`,
        betaCount: sql<number>`COUNT(CASE WHEN ${users.isBeta} = true THEN 1 END)::int`,
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE_TRUNC('day', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${users.createdAt})`);

    // 2. Daily Revenue
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${contributions.createdAt})`,
        revenue: sql<number>`SUM(${contributions.platformFee})::numeric`,
        volume: sql<number>`SUM(${contributions.amount})::numeric`,
      })
      .from(contributions)
      .where(
        and(
          eq(contributions.status, 'confirmed'),
          gte(contributions.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${contributions.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${contributions.createdAt})`);

    // Merge data by date
    const labels: string[] = [];
    const signupData: number[] = [];
    const betaSignupData: number[] = [];
    const revenueData: number[] = [];

    // Initialize map with all dates in the last 30 days
    const statsMap = new Map<string, { signups: number; betaSignups: number; revenue: number }>();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      statsMap.set(dateStr, { signups: 0, betaSignups: 0, revenue: 0 });
    }

    dailySignups.forEach((row: any) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (statsMap.has(dateStr)) {
        const current = statsMap.get(dateStr)!;
        current.signups = row.count;
        current.betaSignups = row.betaCount;
      }
    });

    dailyRevenue.forEach((row: any) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (statsMap.has(dateStr)) {
        const current = statsMap.get(dateStr)!;
        current.revenue = Number(row.revenue);
      }
    });

    // Populate arrays
    Array.from(statsMap.keys()).sort().forEach(date => {
      const stats = statsMap.get(date)!;
      labels.push(date);
      signupData.push(stats.signups);
      betaSignupData.push(stats.betaSignups);
      revenueData.push(stats.revenue);
    });

    return NextResponse.json({
      labels,
      datasets: [
        { label: 'New Users', data: signupData, color: '#3b82f6' },
        { label: 'Beta Signups', data: betaSignupData, color: '#f59e0b' },
        { label: 'Revenue (₦)', data: revenueData, color: '#10b981' },
      ]
    });
  } catch (error) {
    console.error('[Admin Analytics] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch growth analytics' }, { status: 500 });
  }
}
