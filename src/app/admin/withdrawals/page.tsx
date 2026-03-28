import React from 'react';
import { db } from '@/lib/db';
import { withdrawals } from '@/db/schema/withdrawals';
import { users } from '@/db/schema/users';
import { bankAccounts } from '@/db/schema/bankAccounts';
import { eq, desc } from 'drizzle-orm';
import PayoutActionButtons from './PayoutActionButtons';

export const dynamic = 'force-dynamic';

export default async function AdminWithdrawalsPage() {
  // Fetch pending payouts along with bank details and user context
  const pendingPayouts = await db
    .select({
      withdrawalId: withdrawals.id,
      amount: withdrawals.amount,
      status: withdrawals.status,
      createdAt: withdrawals.createdAt,
      creatorName: users.displayName,
      creatorEmail: users.email,
      bankName: bankAccounts.bankName,
      accountNumber: bankAccounts.accountNumber,
      accountName: bankAccounts.accountName,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.creatorId, users.id))
    .leftJoin(bankAccounts, eq(withdrawals.creatorId, bankAccounts.userId))
    .where(eq(withdrawals.status, 'processing'))
    .orderBy(desc(withdrawals.createdAt));

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '8px',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Transfer Payouts
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Review requested creator withdrawals and confirm bank transfers.
        </p>
      </div>

      {pendingPayouts.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>
            Zero pending withdrawal requests. Good job!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pendingPayouts.map((payout) => (
            <div
              key={payout.withdrawalId}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '32px',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {payout.creatorName}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{payout.creatorEmail}</p>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>
                    ₦{Number(payout.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#94a3b8',
                      fontWeight: 700,
                      marginBottom: '12px',
                    }}
                  >
                    Destination Bank Details
                  </h4>

                  {payout.accountNumber ? (
                    <div>
                      <p style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
                        <strong>Bank:</strong> {payout.bankName}
                      </p>
                      <p style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
                        <strong>Acct Name:</strong> {payout.accountName}
                      </p>
                      <p style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>
                        <strong>Acct Number:</strong>{' '}
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            background: '#e2e8f0',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {payout.accountNumber}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>
                      Error: No bank account linked. Do not pay.
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minWidth: '250px',
                }}
              >
                <PayoutActionButtons withdrawalId={payout.withdrawalId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
