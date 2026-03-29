import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { auditLogs } from '@/db/schema/auditLogs';
import { sql, eq, desc } from 'drizzle-orm';
import { GrowthChart } from '@/components/admin/GrowthChart';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Aggregate Metrics in parallel
  const [userCountResp] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [betaCountResp] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.isBeta, true));
  
  const [dauCountResp] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.lastLoginAt} > now() - interval '24 hours'`);

  const [campaignCountResp] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns);

  const [financialStats] = await db
    .select({
      totalVolume: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
      totalRevenue: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
    })
    .from(contributions)
    .where(eq(contributions.status, 'confirmed'));

  const topCampaigns = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      revenue: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
      volume: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
    })
    .from(campaigns)
    .leftJoin(contributions, eq(campaigns.id, contributions.campaignId))
    .where(eq(contributions.status, 'confirmed'))
    .groupBy(campaigns.id)
    .orderBy(desc(sql`SUM(${contributions.amount})`))
    .limit(5);

  const recentLogs = await db
    .select({
      id: auditLogs.id,
      eventType: auditLogs.eventType,
      actorEmail: users.email,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  const userCount = userCountResp?.count || 0;
  const betaCount = betaCountResp?.count || 0;
  const dauCount = dauCountResp?.count || 0;
  const campaignCount = campaignCountResp?.count || 0;
  const totalVolume = Number(financialStats?.totalVolume || 0);
  const totalRevenue = Number(financialStats?.totalRevenue || 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
          Platform Overview
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Live financial metrics and growth telemetry.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {/* Core Stats */}
        <StatCard title="Beta Signups" value={betaCount.toLocaleString()} color="#3b82f6" subValue="Early access members" />
        <StatCard title="Daily Active" value={dauCount.toLocaleString()} color="#f59e0b" subValue="Active last 24h" />
        <StatCard title="Campaigns" value={campaignCount.toLocaleString()} color="#0f172a" />
        <StatCard title="Total Volume" value={`₦${totalVolume.toLocaleString()}`} color="#0f172a" isDark />
        <StatCard title="Backr Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <GrowthChart />
        
        <div style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>Top Performing Campaigns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topCampaigns.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ maxWidth: '160px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rev: ₦{Number(c.revenue).toLocaleString()}</div>
                </div>
                <div style={{ fontWeight: 800, color: '#10b981' }}>₦{Number(c.volume).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', color: '#fff' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Recent Activity Logs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {recentLogs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLogColor(log.eventType) }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.eventType.replace('_', ' ').toUpperCase()}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.actorEmail || 'System'} • {new Date(log.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, subValue, isDark }: any) {
  return (
    <div style={{ 
      background: isDark ? '#0f172a' : '#ffffff', 
      padding: '32px', 
      borderRadius: '16px', 
      border: isDark ? 'none' : '1px solid #e2e8f0', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      color: isDark ? '#fff' : 'inherit'
    }}>
      <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : color, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '8px' }}>
        {title}
      </p>
      <h3 style={{ fontSize: '2.25rem', fontWeight: 900, color: isDark ? '#fff' : (color === '#0f172a' ? '#0f172a' : color) }}>
        {value}
      </h3>
      {subValue && <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{subValue}</p>}
    </div>
  );
}

function getLogColor(type: string) {
  if (type.includes('signup')) return '#3b82f6';
  if (type.includes('donation')) return '#10b981';
  if (type.includes('withdrawal')) return '#f59e0b';
  return '#94a3b8';
}
