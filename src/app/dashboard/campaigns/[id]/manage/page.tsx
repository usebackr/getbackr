'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SpendingLogManager from '@/components/dashboard/SpendingLogManager';
import UpdateManager from '@/components/dashboard/UpdateManager';
import BackerListManager from '@/components/dashboard/BackerListManager';
import { 
  Rocket, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  ClipboardList, 
  Settings,
  ChevronLeft,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
} from 'lucide-react';

export default function CampaignManagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [campaign, setCampaign] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        setCampaign(data.campaign);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${campaign?.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontWeight: 600, color: '#64748b' }}>Initializing Command Center...</p>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Campaign Not Found</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="btn-primary" 
            style={{ marginTop: '20px' }}
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  // Compute live dynamic values
  const raised = parseFloat(campaign.raised || '0');
  const goal = parseFloat(campaign.goalAmount || '1');
  const progress = Math.min(100, Math.floor((raised / goal) * 100));
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : '—';
  
  const statusColors: Record<string, { bg: string; color: string }> = {
    active:    { bg: '#dcfce7', color: '#166534' },
    draft:     { bg: '#f1f5f9', color: '#475569' },
    closed:    { bg: '#fee2e2', color: '#991b1b' },
    cancelled: { bg: '#fef3c7', color: '#92400e' },
  };
  const statusStyle = statusColors[campaign.status] ?? statusColors.draft;

  const stats = [
    { label: 'Amount Raised', value: `₦${raised.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'Total Backers', value: String(campaign.backers ?? 0), icon: Users, color: '#6366f1' },
    { label: 'Days Remaining', value: String(daysRemaining), icon: Clock, color: '#f59e0b' },
    { label: 'Project Views', value: Number(campaign.views ?? 0).toLocaleString(), icon: Eye, color: '#ec4899' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      
      <main className="manage-main">
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{campaign.title}</span>
        </div>

        {/* Header Section */}
        <header style={{ 
          background: '#fff', 
          padding: 'clamp(20px, 4vw, 32px)', 
          borderRadius: '24px', 
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}>
          <div className="header-inner">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ 
                width: '72px', 
                height: '72px',
                flexShrink: 0,
                borderRadius: '18px', 
                background: `url(${campaign.coverImageUrl}) center/cover no-repeat, #f1f5f9`,
                border: '3px solid #f1f5f9'
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 900, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.title}</h1>
                  <span style={{ 
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    background: statusStyle.bg,
                    color: statusStyle.color, 
                    fontSize: '0.7rem', 
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {campaign.status}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', margin: 0 }}>Campaign ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{id.slice(0, 8)}...</code></p>
              </div>
            </div>
          
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                onClick={handleShare}
              >
                {copied ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <Share2 size={16} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <a href={`/c/${campaign.slug}`} target="_blank" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
                <ExternalLink size={16} /> View Page
              </a>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ 
              background: '#fff', 
              padding: '20px 24px', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                flexShrink: 0,
                borderRadius: '14px', 
                background: `${stat.color}15`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={24} />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2px' }}>{stat.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav" style={{ 
          borderBottom: '1px solid #e2e8f0', 
          marginBottom: '32px',
          padding: '0 4px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'updates', label: 'Updates', icon: MessageSquare },
            { id: 'spending', label: 'Spending', icon: ClipboardList },
            { id: 'backers', label: 'Backers', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 4px',
                marginRight: '24px',
                color: activeTab === tab.id ? 'var(--accent-primary)' : '#64748b',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: -1, 
                  left: 0, 
                  right: 0, 
                  height: '3px', 
                  background: 'var(--accent-primary)',
                  borderRadius: '3px 3px 0 0'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <section>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              {/* Campaign Goal */}
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 'clamp(24px, 4vw, 32px)', borderRadius: '24px', color: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Campaign Goal</h3>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: 800 }}>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.25)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: '5px', transition: 'width 0.5s' }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: '4px 0' }}>₦{raised.toLocaleString()} raised of ₦{goal.toLocaleString()}</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>Target: ₦{goal.toLocaleString()}</p>
              </div>

              {/* Ready to Withdraw — only shown when there are funds */}
              {raised > 0 && (
                <div style={{ background: '#0f172a', padding: 'clamp(24px, 4vw, 32px)', borderRadius: '24px', color: '#fff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>Ready to Withdraw?</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: '24px', lineHeight: 1.6 }}>
                    You have <strong style={{ color: '#10b981' }}>₦{raised.toLocaleString()}</strong> gross raised. Go to Wallet to request a payout.
                  </p>
                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none' }} 
                    onClick={() => router.push('/dashboard/wallet')}
                  >
                    Go to Wallet
                  </button>
                </div>
              )}

              {/* No funds yet card */}
              {raised === 0 && (
                <div style={{ background: '#f8fafc', padding: 'clamp(24px, 4vw, 32px)', borderRadius: '24px', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
                  <Rocket size={40} style={{ color: '#cbd5e1' }} />
                  <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>No funds yet</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>Share your campaign to attract your first backers!</p>
                  <button className="btn-primary" style={{ marginTop: '8px' }} onClick={handleShare}>
                    <Share2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Share Campaign
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'updates' && <UpdateManager campaignId={id} />}
          {activeTab === 'spending' && <SpendingLogManager campaignId={id} />}

          {activeTab === 'backers' && <BackerListManager campaignId={id} />}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Campaign Details */}
              <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: 'clamp(24px, 4vw, 32px)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Campaign Info</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Quick summary of your campaign configuration.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'Status', value: campaign.status },
                    { label: 'Category', value: campaign.category || '—' },
                    { label: 'Goal', value: `₦${goal.toLocaleString()}` },
                    { label: 'End Date', value: endDate ? endDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
                      <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0, textTransform: 'capitalize' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #fee2e2', padding: 'clamp(24px, 4vw, 32px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Danger Zone</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>These actions affect your campaign's live status and cannot be undone.</p>

                {campaign.status === 'active' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca', background: '#fff5f5', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>Close Campaign</p>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>Permanently end fundraising. You can still withdraw raised funds.</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to close this campaign? This cannot be undone.')) return;
                        const res = await fetch(`/api/campaigns/${id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'closed' }),
                        });
                        if (res.ok) {
                          setCampaign((prev: any) => ({ ...prev, status: 'closed' }));
                        }
                      }}
                      style={{ padding: '10px 20px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <XCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                      Close Campaign
                    </button>
                  </div>
                )}

                {campaign.status !== 'active' && (
                  <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8' }}>
                    <CheckCircle2 size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>No lifecycle actions available for a <strong style={{ textTransform: 'capitalize' }}>{campaign.status}</strong> campaign.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .manage-main {
          flex: 1;
          padding: clamp(20px, 4vw, 40px);
          min-width: 0;
          margin-left: 280px;
        }
        @media (max-width: 1024px) {
          .manage-main {
            margin-left: 0;
            padding: calc(64px + 20px) clamp(16px, 4vw, 32px) 40px;
          }
        }
        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .header-inner {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-inner > div:last-child {
            width: 100%;
            display: flex;
            gap: 10px;
          }
          .header-inner > div:last-child a,
          .header-inner > div:last-child button {
            flex: 1;
            justify-content: center;
          }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .tab-nav {
          display: flex;
          white-space: nowrap;
        }
        .tab-nav::-webkit-scrollbar { display: none; }
        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 680px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 420px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        .btn-primary {
          background: var(--accent-primary);
          color: #fff;
          border: none;
          padding: 11px 22px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
        }
        .btn-secondary {
          background: #fff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 11px 22px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
