'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { VerificationBanner, OnboardingChecklist } from '@/components/dashboard/Onboarding';

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
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
};

const BackersModal = ({ campaignId, onClose }: { campaignId: string, onClose: () => void }) => {
  const [backers, setBackers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/backers`)
      .then(res => res.json())
      .then(data => {
        setBackers(data.backers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignId]);

  const handleDownloadCSV = () => {
    if (backers.length === 0) return;
    const headers = ['Name', 'Email', 'Amount', 'Currency', 'Date', 'Anonymous'];
    const rows = backers.map(b => [
      b.backerName || 'Guest Contributor',
      b.backerEmail,
      b.amount,
      b.currency,
      new Date(b.createdAt).toLocaleDateString(),
      b.anonymous ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `backers_${campaignId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '32px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Backer List</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{backers.length} people supported this project</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {backers.length > 0 && (
              <button 
                onClick={handleDownloadCSV}
                style={{
                  padding: '10px 20px', borderRadius: '14px', border: '1px solid #e2e8f0',
                  background: '#fff', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                📥 Export CSV
              </button>
            )}
            <button onClick={onClose} style={{
              width: '40px', height: '40px', borderRadius: '20px', border: 'none', background: '#f1f5f9',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>Loading backers...</div>
          ) : backers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>No backers yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Amount</th>
                  <th style={{ padding: '12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {backers.map((b: any) => (
                  <tr key={b.id} style={{ background: '#f8fafc', borderRadius: '12px', transition: 'transform 0.2s' }}>
                    <td style={{ padding: '16px 12px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                      <p style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {b.backerName || 'Guest'}
                        {b.anonymous && (
                          <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#fff', padding: '2px 6px', borderRadius: '8px', color: '#64748b', border: '1px solid #e2e8f0' }}>Anon</span>
                        )}
                      </p>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{b.backerEmail}</p>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <p style={{ fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>
                        {b.currency} {Number(b.amount).toLocaleString()}
                      </p>
                    </td>
                    <td style={{ padding: '16px 12px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{new Date(b.createdAt).toLocaleDateString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
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
  const [selectedCampaignForBackers, setSelectedCampaignForBackers] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);

  const fetchStatsAndBank = async (currentFilter: string) => {
    setLoading(true);
    try {
      const [statsRes, bankRes, campaignsRes, userRes] = await Promise.all([
        fetch(`/api/dashboard/stats?filter=${currentFilter}`),
        fetch('/api/user/bank'),
        fetch('/api/user/campaigns'),
        fetch('/api/user/me'),
      ]);

      // Check for session expiry (401 Unauthorized)
      if (statsRes.status === 401 || bankRes.status === 401 || campaignsRes.status === 401 || userRes.status === 401) {
        console.warn('[Dashboard] Session expired');
        router.push('/login?error=session_expired');
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        setHasBank(!!bankData.account);
      }
      
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        if (campaignsData.campaigns) setCampaigns(campaignsData.campaigns);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete draft');
      }
    } catch (err) {
      alert('A network error occurred');
    }
  };

  const handleEndCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to end this project? It will be moved to "Completed" and will no longer accept donations.')) {
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (res.ok) {
        // Refresh local data
        setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, status: 'closed' } : c)));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to end campaign');
      }
    } catch (err) {
      alert('A network error occurred');
    }
  };

  React.useEffect(() => {
    fetchStatsAndBank(filter);
  }, [filter]);

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

      {selectedCampaignForBackers && (
        <BackersModal 
          campaignId={selectedCampaignForBackers} 
          onClose={() => setSelectedCampaignForBackers(null)} 
        />
      )}

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
                  ? '0 20px 40px rgba(16, 185, 129, 0.15)'
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span className="dash-stat-label">{card.label}</span>
              <span className="dash-stat-value">{loading ? '...' : card.value}</span>
            </div>
          ))}
        </section>

        {user && <VerificationBanner user={user} />}
        
        {user && (
          <OnboardingChecklist 
            user={user} 
            hasCampaigns={campaigns.length > 0} 
            hasBank={hasBank} 
          />
        )}

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
                  const filtered = campaigns.filter((c) => {
                    const status = (c.status || 'draft').toLowerCase();
                    const filter = statusFilter.toLowerCase();
                    if (filter === 'all') return true;
                    if (filter === 'completed') return status === 'closed';
                    return status === filter;
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
                        <p style={{ fontSize: '1.1rem' }}>No {statusFilter} campaigns yet.</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.7 }}>Start a new journey today.</p>
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
                    const isDraft = camp.status?.toLowerCase() === 'draft';

                    return (
                      <div key={camp.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a href={`/c/${camp.slug}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <div
                            className="dash-card"
                            style={{
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              padding: '0',
                              overflow: 'hidden',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
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
                                    camp.status?.toLowerCase() === 'active'
                                      ? '#10b981' // Green
                                      : camp.status?.toLowerCase() === 'closed'
                                      ? '#f59e0b' // Yellow (per user request for Completed)
                                      : '#10b981', // Draft (per user request for Green)
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

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                                <div>
                                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Raised</p>
                                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>₦{raised.toLocaleString()}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>👥 <b>{camp.backers || 0}</b> backers</span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Goal</p>
                                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>₦{goal.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                        
                        {isDraft && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => router.push(`/dashboard/campaigns/create?id=${camp.id}`)}
                              className="btn-primary"
                              style={{ 
                                flex: 1,
                                padding: '12px', 
                                fontSize: '0.9rem',
                                background: 'var(--accent-secondary)',
                                color: '#fff'
                              }}
                            >
                              Edit & Publish
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(camp.id)}
                              style={{ 
                                padding: '12px', 
                                borderRadius: '14px',
                                border: '1px solid #fee2e2',
                                background: '#fff5f5',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                width: '48px'
                              }}
                              title="Delete Draft"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        )}

                        {!isDraft && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={() => setSelectedCampaignForBackers(camp.id)}
                              className="btn-primary"
                              style={{ 
                                flex: 2,
                                padding: '12px', 
                                fontSize: '0.9rem',
                                background: 'var(--accent-primary)',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 700,
                                borderRadius: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              View Backers
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/campaigns/create?id=${camp.id}`)}
                              style={{ 
                                flex: 2,
                                padding: '12px', 
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                color: '#0f172a',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                              }}
                            >
                              Edit Project
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to end this campaign? This cannot be undone.')) {
                                  try {
                                    const res = await fetch(`/api/campaigns/${camp.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'closed' }),
                                    });
                                    if (res.ok) fetchStatsAndBank(filter);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              style={{ 
                                padding: '12px', 
                                borderRadius: '14px',
                                border: '1px solid #fee2e2',
                                background: '#fff5f5',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                width: '48px'
                              }}
                              title="End Campaign"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        )}
                      </div>
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
