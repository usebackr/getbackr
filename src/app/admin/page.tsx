import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { sql, eq } from 'drizzle-orm';

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

  const userCount = userCountResp?.count || 0;
  const betaCount = betaCountResp?.count || 0;
  const dauCount = dauCountResp?.count || 0;
  const campaignCount = campaignCountResp?.count || 0;
  const totalVolume = Number(financialStats?.totalVolume || 0);
  const totalRevenue = Number(financialStats?.totalRevenue || 0);

  return (
    <div>
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
          Platform Overview
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Live financial metrics and health records.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Beta Early Access
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e3a8a' }}>
            {betaCount.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Total beta signups
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Daily Active Users
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#92400e' }}>
            {dauCount.toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Active last 24h
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            Active Campaigns
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>
            {campaignCount.toLocaleString()}
          </h3>
        </div>

        <div
          style={{
            background: '#0f172a',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 700,
              marginBottom: '8px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Total Money Moved
          </p>
          <h3
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#ffffff',
              position: 'relative',
              zIndex: 1,
            }}
          >
            ₦{totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </h3>
          <div
            style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              fontSize: '6rem',
              opacity: 0.1,
              color: '#fff',
            }}
          >
            ₦
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #10b981',
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Backr 5% Revenue
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#065f46' }}>
            ₦{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* Add placeholder for future charts */}
      <div
        style={{
          background: '#ffffff',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Revenue Growth
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Visual telemetry chart module currently unmounted in V1.
        </p>
        <div
          style={{
            width: '100%',
            height: '300px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed #cbd5e1',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Chart coming soon.</span>
        </div>
      </div>
    </div>
  );
}
