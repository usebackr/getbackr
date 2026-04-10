import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { auditLogs } from '@/db/schema/auditLogs';
import { sql, eq, desc, and } from 'drizzle-orm';
import { GrowthChart } from '@/components/admin/GrowthChart';
import { ReconcileButton } from '@/components/admin/ReconcileButton';
import { ShieldCheck, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Run all queries in parallel, each independently fault-tolerant.
  const results = await Promise.allSettled([
    db.select({ count: sql<number>`count(*)::int` }).from(users), // 0: userCount
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`is_beta = true`), // 1: betaCount
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`last_login_at > now() - interval '24 hours'`), // 2: dauCount
    db.select({ count: sql<number>`count(*)::int` }).from(campaigns), // 3: campaignCount
    db // 4: financials
      .select({
        totalVolume: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
        totalRevenue: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
      })
      .from(contributions)
      .where(eq(contributions.status, 'confirmed')),
    db // 5: topCampaigns
      .select({
        id: campaigns.id,
        title: campaigns.title,
        revenue: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
        volume: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
      })
      .from(campaigns)
      .leftJoin(
        contributions,
        and(eq(campaigns.id, contributions.campaignId), eq(contributions.status, 'confirmed')),
      )
      .groupBy(campaigns.id)
      .orderBy(desc(sql`COALESCE(SUM(${contributions.amount}), 0)`))
      .limit(5),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.isBeta, true), eq(users.emailVerified, true))), // 6: verifiedBeta
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.isBeta, true), eq(users.kycStatus, 'verified'))), // 7: kycBeta
    db // 8: recentBetaUsers
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        emailVerified: users.emailVerified,
        kycStatus: users.kycStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isBeta, true))
      .orderBy(desc(users.createdAt))
      .limit(10),
    db // 9: logs
      .select({
        id: auditLogs.id,
        eventType: auditLogs.eventType,
        actorEmail: users.email,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
    db // 10: pendingPayments (Last 48 hours)
      .select({ count: sql<number>`count(*)::int` })
      .from(contributions)
      .where(and(eq(contributions.status, 'pending'), sql`${contributions.createdAt} > now() - interval '48 hours'`)),
  ]);

  const getValue = (index: number) =>
    results[index].status === 'fulfilled' ? (results[index] as any).value : null;

  const betaCount = getValue(1)?.[0]?.count || 0;
  const dauCount = getValue(2)?.[0]?.count || 0;
  const financialStats = getValue(4)?.[0] || null;
  const verifiedBetaCount = getValue(6)?.[0]?.count || 0;
  const kycBetaCount = getValue(7)?.[0]?.count || 0;
  const recentBetaUsers = getValue(8) || [];
  const recentLogs = getValue(9) || [];
  const pendingPaymentsCount = getValue(10)?.[0]?.count || 0;

  const totalVolume = Number(financialStats?.totalVolume || 0);
  const totalRevenue = Number(financialStats?.totalRevenue || 0);

  // Conversion rates
  const verificationRate = betaCount > 0 ? Math.round((verifiedBetaCount / betaCount) * 100) : 0;
  const kycRate = verifiedBetaCount > 0 ? Math.round((kycBetaCount / verifiedBetaCount) * 100) : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '8px',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Beta Pulse Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Real-time insights into your early access launch and onboarding funnel.
        </p>
      </div>

      {/* Main Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          title="Total Beta Users"
          value={betaCount.toLocaleString()}
          color="#3b82f6"
          subValue={`${verificationRate}% verification rate`}
        />
        <StatCard
          title="Daily Active"
          value={dauCount.toLocaleString()}
          color="#f59e0b"
          subValue="Active last 24h"
        />
        <StatCard
          title="Platform Volume"
          value={`₦${totalVolume.toLocaleString()}`}
          color="#0f172a"
          isDark
        />
        <StatCard
          title="Backr Revenue"
          value={`₦${totalRevenue.toLocaleString()}`}
          color="#10b981"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPaymentsCount.toLocaleString()}
          color={pendingPaymentsCount > 0 ? '#ef4444' : '#64748b'}
          subValue="Last 48 hours"
          isAlert={pendingPaymentsCount > 0}
        />
      </div>

      {/* Onboarding Funnel */}
      <div
        style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '48px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
          Onboarding Funnel
        </h3>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <FunnelStep
            title="Signups"
            count={betaCount}
            sub={`${verificationRate}% convert`}
            isActive
          />
          <FunnelArrow />
          <FunnelStep
            title="Verified"
            count={verifiedBetaCount}
            sub={`${kycRate}% move to KYC`}
            isActive={verifiedBetaCount > 0}
          />
          <FunnelArrow />
          <FunnelStep
            title="KYC Approved"
            count={kycBetaCount}
            sub="Ready to contribute"
            color="#10b981"
            isActive={kycBetaCount > 0}
          />
        </div>
      </div>
      {/* Financial Audit Section */}
      <div 
        style={{
          background: '#f8fafc',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            background: '#fff', 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <ShieldCheck size={28} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              Financial Integrity Audit
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={14} /> Manually sync stuck payments with Paystack logs. Safe and idempotent.
            </p>
          </div>
        </div>
        <ReconcileButton />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '32px',
          marginBottom: '48px',
        }}
      >
        {/* Recent Beta Onboarding */}
        <div
          style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <h3
            style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}
          >
            Recent Beta Onboarding
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentBetaUsers.map((u: any) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {u.displayName || u.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <StatusBadge label="VERIFIED" active={u.emailVerified} color="#3b82f6" />
                  <StatusBadge label="KYC" active={u.kycStatus === 'verified'} color="#10b981" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth telemetry (Chart Placeholder / Reduced) */}
        <GrowthChart />
      </div>

      <div style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', color: '#fff' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>
          Recent Activity Logs
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {recentLogs.map((log: any) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                padding: '12px 16px',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getLogColor(log.eventType),
                }}
              />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {log.eventType.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {log.actorEmail || 'System'} • {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ title, count, sub, isActive, color = '#3b82f6' }: any) {
  return (
    <div style={{ flex: 1, textAlign: 'center', opacity: isActive ? 1 : 0.4 }}>
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#64748b',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isActive ? color : '#64748b' }}>
        {count}
      </div>
      <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sub}</p>
    </div>
  );
}

function FunnelArrow() {
  return <div style={{ color: '#cbd5e1', fontSize: '1.5rem', fontWeight: 900 }}>→</div>;
}

function StatusBadge({ label, active, color }: any) {
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 900,
        padding: '4px 8px',
        borderRadius: '6px',
        background: active ? `${color}20` : '#f1f5f9',
        color: active ? color : '#94a3b8',
        border: active ? `1px solid ${color}40` : '1px solid #e2e8f0',
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ title, value, color, subValue, isDark, isAlert }: any) {
  return (
    <div
      style={{
        background: isDark ? '#0f172a' : '#ffffff',
        padding: '32px',
        borderRadius: '16px',
        border: isDark ? 'none' : isAlert ? `2px solid #ef4444` : '1px solid #e2e8f0',
        boxShadow: isAlert ? '0 0 20px rgba(239, 68, 68, 0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
        color: isDark ? '#fff' : 'inherit',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isAlert && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          height: '100%',
          background: '#ef4444'
        }} />
      )}
      <p
        style={{
          fontSize: '0.85rem',
          color: isDark ? '#94a3b8' : color,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 800,
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <h3
        style={{
          fontSize: '2.25rem',
          fontWeight: 900,
          color: isDark ? '#fff' : color === '#0f172a' ? '#0f172a' : color,
        }}
      >
        {value}
      </h3>
      {subValue && (
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{subValue}</p>
      )}
    </div>
  );
}

function getLogColor(type: string) {
  if (type.includes('signup')) return '#3b82f6';
  if (type.includes('donation')) return '#10b981';
  if (type.includes('withdrawal')) return '#f59e0b';
  return '#94a3b8';
}
