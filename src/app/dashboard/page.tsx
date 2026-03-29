'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const Icons = {
  Empty: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Filter: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
};

export default function DashboardPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    totalRaised: 0,
    withdrawable: 0,
    totalCampaigns: 0,
    totalViews: 0,
    currency: '₦',
  });
  const [filter, setFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [hasBank, setHasBank] = React.useState(false);
  const [showBankError, setShowBankError] = React.useState(false);

  const fetchStatsAndBank = async (currentFilter: string) => {
    setLoading(true);
    try {
      const [statsRes, bankRes, campaignsRes] = await Promise.all([
        fetch(`/api/dashboard/stats?filter=${currentFilter}`),
        fetch('/api/user/bank'),
        fetch('/api/user/campaigns'),
      ]);
      const statsData = await statsRes.json();
      const bankData = await bankRes.json();
      const campaignsData = await campaignsRes.json();

      if (statsRes.ok) setStats(statsData);
      if (bankRes.ok) setHasBank(!!bankData.account);
      if (campaignsRes.ok && campaignsData.campaigns) setCampaigns(campaignsData.campaigns);
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatsAndBank(filter);
  }, [filter]);

  const handleWithdrawClick = () => {
    if (!hasBank) {
      setShowBankError(true);
    } else {
      // Trigger normal withdrawal modal (Implementation for another phase)
      alert('Withdrawal flow initiating...');
    }
  };

  const statCards = [
    {
      label: 'Total Raised',
      value: `${stats.currency}${stats.totalRaised.toLocaleString()}`,
      bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      color: '#ffffff',
    },
    {
      label: 'Withdrawable Amount',
      value: `${stats.currency}${stats.withdrawable.toLocaleString()}`,
      bg: '#ffffff',
      color: 'var(--text-primary)',
      border: '1px solid #f1f5f9',
    },
    {
      label: 'Total Campaigns',
      value: stats.totalCampaigns.toString(),
      bg: '#ffffff',
      color: 'var(--text-primary)',
      border: '1px solid #f1f5f9',
    },
    {
      label: 'Campaign Views',
      value: stats.totalViews.toLocaleString(),
      bg: '#ffffff',
      color: 'var(--text-primary)',
      border: '1px solid #f1f5f9',
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {showBankError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="card"
            style={{ padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}
          >
            <h2
              style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--accent-secondary)' }}
            >
              Payout Account Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              You must add a verified local bank account before you can withdraw your campaign
              funds.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowBankError(false)}
                className="btn-secondary"
                style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none' }}
              >
                Cancel
              </button>
              <a
                href="/dashboard/settings"
                className="btn-primary"
                style={{ padding: '12px 24px', textDecoration: 'none' }}
              >
                Add Bank Account
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="dash-main" style={{ flex: 1 }}>
        <header
          className="dash-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '4px', fontWeight: 800 }}>My Campaigns</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Manage your creative ventures and transparency logs
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }} className="dash-header-actions">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 140px' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  appearance: 'none',
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Time</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  pointerEvents: 'none',
                  color: 'var(--text-secondary)',
                }}
              >
                <Icons.Filter />
              </div>
            </div>
            
            <button
              onClick={() => router.push('/dashboard/campaigns/create')}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem', flex: '1 1 auto' }}
            >
              + Create
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="dash-stat-card"
              style={{
                background: card.bg,
                color: card.color,
                border: card.border || 'none',
                boxShadow: card.bg.includes('gradient')
                  ? '0 20px 40px rgba(255, 122, 0, 0.15)'
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span className="dash-stat-label">{card.label}</span>
              <span className="dash-stat-value">{loading ? '...' : card.value}</span>
              {card.bg.includes('gradient') && (
                <div
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    bottom: '-10px',
                    opacity: 0.1,
                    transform: 'rotate(-15deg)',
                  }}
                >
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </section>

        {campaigns.length === 0 && !loading ? (
          <section
            className="dash-card"
            style={{
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#f8fafc',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <Icons.Empty />
            </div>
            <h3
              style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--accent-secondary)' }}
            >
              Ready to launch your first venture?
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '420px',
                margin: '0 auto 32px',
                lineHeight: 1.6,
              }}
            >
              You haven't initiated any campaigns yet. Start your journey by creating a campaign to
              build trust and raise funds for your creative project.
            </p>
            <button
              onClick={() => router.push('/dashboard/campaigns/create')}
              className="btn-primary"
              style={{ padding: '16px 40px' }}
            >
              Initiate Your First Campaign
            </button>
          </section>
        ) : (
          <section>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '20px',
                  color: 'var(--text-secondary)',
                }}
              >
                {campaigns.length} Campaign{campaigns.length !== 1 ? 's' : ''}
              </h3>

              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '10px' }} className="hide-scrollbar">
                {['all', 'draft', 'active', 'completed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      background: statusFilter === s ? 'var(--accent-primary)' : '#f1f5f9',
                      color: statusFilter === s ? '#fff' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                  gap: '32px',
                }}
              >
                {(() => {
                  const filtered = campaigns.filter(c => {
                    if (statusFilter === 'all') return true;
                    if (statusFilter === 'completed') return c.status === 'closed';
                    return c.status === statusFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ 
                        gridColumn: '1 / -1', 
                        padding: '60px 0', 
                        textAlign: 'center', 
                        background: '#f8fafc', 
                        borderRadius: '24px',
                        border: '2px dashed #e2e8f0',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        <p style={{ fontSize: '1.1rem' }}>None</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.7 }}>No {statusFilter} campaigns found.</p>
                      </div>
                    );
                  }

                  return filtered.map((camp: any) => {
                    const goal = parseFloat(camp.goalAmount || '0');
                    const raised = parseFloat(camp.raised || '0');
                    const pct = goal > 0 ? Math.floor(Math.min((raised / goal) * 100, 100)) : 0;
                    const daysLeft = Math.ceil(
                      (new Date(camp.endDate).getTime() - new Date().getTime()) / 86400000,
                    );
                    return (
                      <a key={camp.id} href={`/c/${camp.slug}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="dash-card"
                          style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            padding: '0',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '160px',
                              background: '#f1f5f9',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            {camp.coverImageUrl ? (
                              <img
                                src={camp.coverImageUrl}
                                alt={camp.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '3rem',
                                }}
                              >
                                🎬
                              </div>
                            )}
                            {camp.category && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '12px',
                                  left: '12px',
                                  background: 'rgba(255,255,255,0.95)',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#0f172a',
                                }}
                              >
                                {camp.category}
                              </span>
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background:
                                  camp.status === 'active'
                                    ? '#10b981'
                                    : camp.status === 'closed'
                                    ? '#3b82f6'
                                    : '#64748b',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                            >
                              {camp.status}
                            </span>
                          </div>

                          <div style={{ padding: '20px' }}>
                            <h4
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                marginBottom: '8px',
                                color: '#0f172a',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {camp.title}
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                              <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{pct}%</span>
                            </div>
                            
                            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Raised</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>₦{raised.toLocaleString()}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Goal</p>
                                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>₦{goal.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  });
                })()}
              </div>
            </section>
          )}
        </main>
      </div>
    );
}
