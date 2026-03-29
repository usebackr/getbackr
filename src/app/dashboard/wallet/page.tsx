'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function WalletDashboard() {
  const [summary, setSummary] = useState({
    totalRaised: 0,
    totalFees: 0,
    totalWithdrawn: 0,
    availableBalance: 0,
    campaigns: [],
    kycStatus: 'pending',
    hasBank: false,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWallet = async () => {
    try {
      const sumRes = await fetch('/api/dashboard/wallet-summary');
      if (sumRes.ok) setSummary(await sumRes.json());

      const txRes = await fetch('/api/dashboard/wallet-transactions');
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    // Poll every 30 seconds for live feel
    const interval = setInterval(fetchWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety Checks
    if (!summary.hasBank) {
      setError('You must link a bank account in Settings before withdrawing.');
      return;
    }
    if (summary.kycStatus !== 'verified') {
      setError('Identity verification (KYC) is required for withdrawals. Please visit the KYC tab.');
      return;
    }

    setActing(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount, reason: withdrawReason, campaignId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to request withdrawal');

      setSuccess('Withdrawal requested successfully. Your request is pending and will be reviewed within 1 hour.');
      setWithdrawAmount('');
      setWithdrawReason('');
      setCampaignId('');
      fetchWallet(); // Rehydrate immediately
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: '4px', fontWeight: 800 }}>Wallet</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
            Manage your creator earnings and payouts.
          </p>
        </header>

        {/* Withdrawal Guards Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {!summary.hasBank && (
            <div style={{ padding: '16px 20px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏦</span>
                <p style={{ fontSize: '0.85rem', color: '#9a3412', fontWeight: 600 }}>Link a bank account to enable withdrawals.</p>
              </div>
              <a href="/dashboard/settings" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none' }}>Settings</a>
            </div>
          )}
          {summary.kycStatus !== 'verified' && (
            <div style={{ padding: '16px 20px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                <p style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>KYC Verification is required for payouts.</p>
              </div>
              <a href="/dashboard/kyc" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none' }}>Verify Now</a>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading wallet data...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                gap: '24px',
              }}
            >
              <div
                className="dash-stat-card glass"
                style={{ borderTop: '4px solid var(--accent-primary)', minWidth: '0' }}
              >
                <p className="dash-stat-label">Total Raised</p>
                <p className="dash-stat-value">₦{summary.totalRaised.toLocaleString()}</p>
              </div>
              <div className="dash-stat-card glass" style={{ borderTop: '4px solid #f59e0b' }}>
                <p className="dash-stat-label">Total Fees</p>
                <p className="dash-stat-value" style={{ color: '#f59e0b' }}>
                  ₦{summary.totalFees.toLocaleString()}
                </p>
              </div>
              <div className="dash-stat-card glass" style={{ borderTop: '4px solid #3b82f6' }}>
                <p className="dash-stat-label">Total Withdrawn</p>
                <p className="dash-stat-value" style={{ color: '#3b82f6' }}>
                  ₦{summary.totalWithdrawn.toLocaleString()}
                </p>
              </div>
              <div
                className="dash-stat-card glass"
                style={{ borderTop: '4px solid #10b981', background: '#ecfdf5' }}
              >
                <p className="dash-stat-label">Available Balance</p>
                <p className="dash-stat-value" style={{ color: '#166534' }}>
                  ₦{summary.availableBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Withdraw Section */}
            <div className="dash-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Request Withdrawal</h3>
              <form
                onSubmit={handleWithdraw}
                style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}
              >
                <div
                  className="mobile-stack"
                  style={{
                    flex: '1 1 300px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      ₦
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount to withdraw"
                      min="1000"
                      max={summary.availableBalance}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 36px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '1rem',
                      fontWeight: 500,
                      background: '#fff',
                    }}
                  >
                    <option value="" disabled>
                      Select Campaign for Withdrawal
                    </option>
                    {(summary.campaigns || []).map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="State the public purpose for this withdrawal..."
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '1rem',
                      fontWeight: 500,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  ></textarea>

                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Minimum withdrawal is ₦1,000. Your reason will be logged publicly for
                    transparency.
                  </p>
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <button
                    type="submit"
                    disabled={acting || summary.availableBalance <= 0}
                    className="btn-primary"
                    style={{
                      padding: '14px 32px',
                      opacity: acting || summary.availableBalance <= 0 ? 0.5 : 1,
                    }}
                  >
                    {acting ? 'Processing...' : 'Withdraw Funds'}
                  </button>
                </div>
              </form>
              {error && (
                <p
                  style={{
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    marginTop: '16px',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  style={{
                    color: '#10b981',
                    fontSize: '0.9rem',
                    marginTop: '16px',
                    fontWeight: 600,
                  }}
                >
                  {success}
                </p>
              )}
            </div>

            {/* Transaction History */}
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="dash-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b' }}>No wallet transactions yet.</p>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th
                            style={{
                              padding: '16px 24px',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            Type
                          </th>
                          <th
                            style={{
                              padding: '16px 24px',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            Description
                          </th>
                          <th
                            style={{
                              padding: '16px 24px',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: '16px 24px',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: '16px 24px',
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx: any, idx) => (
                          <tr
                            key={`${tx.type}-${tx.id}-${idx}`}
                            style={{ borderBottom: '1px solid #f1f5f9' }}
                          >
                            <td style={{ padding: '16px 24px' }}>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: tx.type === 'contribution' ? '#dcfce7' : '#fee2e2',
                                  color: tx.type === 'contribution' ? '#166534' : '#991b1b',
                                }}
                              >
                                {tx.type === 'contribution' ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                              {tx.description}
                              {tx.type === 'contribution' && (
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    marginTop: '4px',
                                  }}
                                >
                                  Fee: ₦{Number(tx.platformFee).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: '16px 24px',
                                fontWeight: 700,
                                color: tx.type === 'contribution' ? '#10b981' : '#0f172a',
                              }}
                            >
                              {tx.type === 'contribution' ? '+' : '-'}₦
                              {Number(tx.amount).toLocaleString()}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#64748b',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {tx.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#475569',
                                fontSize: '0.85rem',
                              }}
                            >
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
