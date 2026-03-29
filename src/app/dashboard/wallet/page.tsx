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
      const [sumRes, txRes] = await Promise.all([
        fetch('/api/dashboard/wallet-summary'),
        fetch('/api/dashboard/wallet-transactions')
      ]);

      if (sumRes.status === 401 || txRes.status === 401) {
        console.warn('[Wallet] Session expired');
        window.location.href = '/login?error=session_expired';
        return;
      }

      if (sumRes.ok) setSummary(await sumRes.json());
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
      <main className="dash-main" style={{ flex: 1, padding: 'clamp(16px, 5vw, 40px)' }}>
        <header style={{ marginBottom: '32px' }}>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
              padding: '0', fontSize: '0.9rem'
            }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '4px', fontWeight: 900 }}>Wallet</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                Manage your creator earnings and payouts.
              </p>
            </div>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>
               LIVE BALANCE
            </div>
          </div>
        </header>

        {/* Withdrawal Guards Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {!summary.hasBank && (
            <div style={{ padding: '16px 20px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(251, 146, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2.5"><path d="M3 21h18M3 10h18M5 10V5a2 2 0 012-2h10a2 2 0 012 2v5M8 21v-7M12 21v-7M16 21v-7"/></svg>
                 </div>
                 <p style={{ fontSize: '0.85rem', color: '#9a3412', fontWeight: 700 }}>Link a bank account to enable withdrawals.</p>
              </div>
              <a href="/dashboard/settings" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>Settings</a>
            </div>
          )}
          {summary.kycStatus !== 'verified' && (
            <div style={{ padding: '16px 20px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                 </div>
                 <p style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 700 }}>KYC Verification is required for payouts.</p>
              </div>
              <a href="/dashboard/kyc" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>Verify Now</a>
            </div>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading wallet data...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Summary Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '20px' 
            }}>
              {[
                { label: 'Total Raised', value: summary.totalRaised, color: 'var(--accent-primary)', bg: '#fff' },
                { label: 'Total Fees', value: summary.totalFees, color: '#f59e0b', bg: '#fff' },
                { label: 'Total Withdrawn', value: summary.totalWithdrawn, color: '#3b82f6', bg: '#fff' },
                { label: 'Available Balance', value: summary.availableBalance, color: '#059669', bg: '#ecfdf5', highlight: true },
              ].map((stat, i) => (
                <div key={i} className="dash-card" style={{ 
                  padding: '24px', 
                  borderTop: `4px solid ${stat.color}`,
                  background: stat.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color }}>₦{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Withdraw Section */}
            <div className="dash-card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Request Withdrawal</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 500 }}>
                 Funds are typically processed within 24 hours of request.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Withdrawal Amount</label>
                     <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '14px', fontWeight: 900, color: 'var(--accent-primary)' }}>₦</span>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          min="1000"
                          max={summary.availableBalance}
                          required
                          style={{ width: '100%', padding: '14px 16px 14px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.1rem', fontWeight: 800 }}
                        />
                     </div>
                   </div>

                   <div>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Select Project</label>
                     <select
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600, background: '#fff' }}
                      >
                        <option value="" disabled>Select Campaign...</option>
                        {(summary.campaigns || []).map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Transparency Reason</label>
                    <textarea
                      value={withdrawReason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      placeholder="e.g., Purchasing textbooks for the library project..."
                      required
                      rows={3}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 500, resize: 'none' }}
                    />
                  </div>

                  {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
                  {success && <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>{success}</div>}

                  <button
                    onClick={handleWithdraw}
                    disabled={acting || summary.availableBalance <= 0}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800 }}
                  >
                    {acting ? 'Processing...' : 'Submit Withdrawal Request'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="dash-card" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#64748b' }}>No wallet transactions yet.</p>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                          <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                          <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                          <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx: any, idx) => (
                          <tr key={`${tx.type}-${tx.id}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, background: tx.type === 'contribution' ? '#ecfdf5' : '#fef2f2', color: tx.type === 'contribution' ? '#059669' : '#dc2626', textTransform: 'uppercase' }}>
                                {tx.type === 'contribution' ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{tx.description}</div>
                              {tx.type === 'contribution' && (
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                  Fee: ₦{Number(tx.platformFee).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: 800, fontSize: '1rem', color: tx.type === 'contribution' ? '#059669' : '#0f172a' }}>
                              {tx.type === 'contribution' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ fontSize: '0.8rem', color: tx.status === 'confirmed' || tx.status === 'completed' ? '#059669' : '#64748b', fontWeight: 500, textTransform: 'capitalize' }}>
                                {tx.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem' }}>
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
