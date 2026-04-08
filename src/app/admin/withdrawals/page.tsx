import React from 'react';
import { db } from '@/lib/db';
import { withdrawals } from '@/db/schema/withdrawals';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import PayoutActionButtons from './PayoutActionButtons';
import { getTransferBalance } from '@/lib/payments/paystack';

export const dynamic = 'force-dynamic';

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1', 10);
  const limitCount = 50;
  const offsetCount = (page - 1) * limitCount;

  // ---------------------------------------------------------------------------
  // Data Fetching with Safety Net
  // ---------------------------------------------------------------------------
  let enrichedPayouts: any[] = [];
  let paystackBalance: number | null = null;
  let totalCount = 0;
  let fetchError = false;

  try {
    // 1. Fetch live Paystack balance for liquidity check
    try {
      paystackBalance = await getTransferBalance();
    } catch (err) {
      console.error('[AdminWithdrawals] Paystack balance fetch failed:', err);
    }

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(withdrawals);
    totalCount = Number(countResult[0].count) || 0;

    const payoutsWithContext = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        reason: withdrawals.reason,
        rejectionReason: withdrawals.rejectionReason,
        createdAt: withdrawals.createdAt,
        creatorName: users.displayName,
        creatorEmail: users.email,
        campaignTitle: campaigns.title,
        campaignId: campaigns.id,
        walletId: projectWallets.id,
        snapAccountNumber: withdrawals.accountNumber,
        snapBankCode: withdrawals.bankCode,
        snapAccountName: withdrawals.accountName,
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.creatorId, users.id))
      .leftJoin(projectWallets, eq(projectWallets.id, withdrawals.walletId))
      .leftJoin(campaigns, eq(campaigns.id, projectWallets.campaignId))
      .orderBy(desc(withdrawals.createdAt))
      .limit(limitCount)
      .offset(offsetCount);

    // For each payout, we'll calculate financial context
    enrichedPayouts = await Promise.all(payoutsWithContext.map(async (payout) => {
      // 1. Calc Lifetime Project Raised (Gross) & Fees
      const [contribStats] = await db
        .select({
          totalAmount: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
          totalPlatformFee: sql<number>`COALESCE(SUM(${contributions.platformFee}), 0)::numeric`,
        })
        .from(contributions)
        .where(and(
          eq(contributions.campaignId, payout.campaignId || ''), 
          eq(contributions.status, 'confirmed')
        ));

      // 2. Calc Total Already Withdrawn
      const [withdrawalStats] = await db
        .select({
          totalWithdrawn: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)::numeric`,
        })
        .from(withdrawals)
        .where(and(
          eq(withdrawals.walletId, payout.walletId || ''),
          eq(withdrawals.status, 'completed')
        ));

      const totalRaised = Number(contribStats?.totalAmount || 0);
      const platformFees = Number(contribStats?.totalPlatformFee || 0);
      const withdrawnSum = Number(withdrawalStats?.totalWithdrawn || 0);
      const currentBalance = totalRaised - platformFees - withdrawnSum;

      return {
        ...payout,
        financials: {
          totalRaised,
          platformFees,
          currentBalance,
          remainingAfter: currentBalance - Number(payout.amount)
        }
      };
    }));
  } catch (err) {
    console.error('[AdminWithdrawals] Critical fetch failure:', err);
    fetchError = true;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Error Banner */}
      {fetchError && (
        <div style={{ 
          padding: '32px', 
          background: '#fff1f2', 
          border: '1px solid #fda4af', 
          borderRadius: '24px', 
          color: '#9f1239', 
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h3 style={{ fontWeight: 900, margin: 0, fontSize: '1.25rem' }}>Database Synchronization Issue</h3>
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
            We encountered an exception while fetching payout data for the governance dashboard. 
            This typically occurs if the production database schema is out of sync with the latest application code, 
            or if Row Level Security (RLS) is blocking the required administrative joins.
          </p>
          <div style={{ marginTop: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
            Action: Run <strong>npm run db:migrate</strong> and verify RLS policies for <em>project_wallets</em>.
          </div>
        </div>
      )}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
          Payout Governance 🏛️
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>
          Review, analyze, and authorize fund transfers for Backr campaigns.
        </p>
      </div>

      {/* Paystack Liquidity Banner */}
      <div style={{ 
        marginBottom: '40px',
        padding: '32px',
        background: '#0f172a',
        borderRadius: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <span style={{ fontSize: '2rem' }}>💰</span>
          </div>
          <div>
            <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Paystack Account Liquidity
            </h3>
            <p style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: 900, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              {paystackBalance !== null ? `₦${paystackBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Live API Feed</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Available for Transfers</p>
        </div>
      </div>

      {enrichedPayouts.length === 0 ? (
        <div style={{ padding: '80px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>No withdrawal requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {enrichedPayouts.map((payout) => (
            <div
              key={payout.id}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: payout.status === 'rejected' ? '1px solid #fee2e2' : '1px solid #e2e8f0',
                padding: '40px',
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '40px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Status Indicator Bar */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                bottom: 0, 
                width: '6px', 
                background: payout.status === 'completed' ? '#10b981' : (payout.status === 'rejected' ? '#ef4444' : '#f59e0b') 
              }} />

              {/* Left Side: context */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      color: 'var(--accent-primary)', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      marginBottom: '4px',
                      display: 'block'
                    }}>
                      Project: {payout.campaignTitle || 'General Wallet'}
                    </span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                      {payout.creatorName}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>{payout.creatorEmail}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      ₦{Number(payout.amount).toLocaleString()}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: payout.status === 'completed' ? '#dcfce7' : (payout.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                      color: payout.status === 'completed' ? '#166534' : (payout.status === 'rejected' ? '#991b1b' : '#92400e'),
                    }}>
                      {payout.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Reason / Justification */}
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Withdrawal Justification
                  </h4>
                  <p style={{ color: '#334155', lineHeight: 1.6, fontStyle: 'italic', fontSize: '1rem' }}>
                    "{payout.reason || 'No specific reason provided.'}"
                  </p>
                </div>

                {/* Live Financial Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Gross Raised</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>₦{payout.financials.totalRaised.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Platform Fees</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>₦{payout.financials.platformFees.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                    <p style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, marginBottom: '4px' }}>Current Balance</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>₦{payout.financials.currentBalance.toLocaleString()}</p>
                  </div>
                </div>

                {payout.status === 'rejected' && payout.rejectionReason && (
                   <div style={{ padding: '16px', background: '#fff1f2', borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
                     <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px', textTransform: 'uppercase' }}>Rejection Feedback:</p>
                     <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>{payout.rejectionReason}</p>
                   </div>
                )}
              </div>

              {/* Right Side: Banking & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '24px', background: '#0f172a', borderRadius: '16px', color: '#fff' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Destination Account
                  </h4>
                  {payout.snapAccountNumber ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Bank Name</p>
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>{payout.snapBankCode} - Nigerian Bank</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Account Holder</p>
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>{payout.snapAccountName}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Account Number</p>
                        <p style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.1em', color: '#10b981' }}>{payout.snapAccountNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#ef4444', fontWeight: 800 }}>CRITICAL: Missing Bank Intel</p>
                  )}
                </div>

                {payout.status === 'processing' && <PayoutActionButtons withdrawalId={payout.id} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalCount > limitCount && (
        <div style={{ marginTop: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
            Showing page {page} of {Math.ceil(totalCount / limitCount)} ({totalCount} total withdrawals)
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href={page <= 1 ? '#' : `/admin/withdrawals?page=${page - 1}`}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                textDecoration: 'none',
                opacity: page <= 1 ? 0.5 : 1,
                pointerEvents: page <= 1 ? 'none' : 'auto',
              }}
            >
              Previous
            </a>
            <a
              href={page * limitCount >= totalCount ? '#' : `/admin/withdrawals?page=${page + 1}`}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                textDecoration: 'none',
                opacity: page * limitCount >= totalCount ? 0.5 : 1,
                pointerEvents: page * limitCount >= totalCount ? 'none' : 'auto',
              }}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
