'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SpendingLogManager from '@/components/dashboard/SpendingLogManager';
import UpdateManager from '@/components/dashboard/UpdateManager';
import { 
  Rocket, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Receipt, 
  Settings,
  ChevronLeft,
  Share2,
  ExternalLink
} from 'lucide-react';

export default function CampaignManagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [campaign, setCampaign] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');

  React.useEffect(() => {
    // In a real app, this would be an API call /api/campaigns/[id]
    // For now, we'll fetch basic info to show we own it
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        setCampaign(data.campaign);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  const stats = [
    { label: 'Amount Raised', value: `₦${parseFloat(campaign.raised || '0').toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'Total Backers', value: campaign.backers || '0', icon: Users, color: '#6366f1' },
    { label: 'Days Remaining', value: '12', icon: Clock, color: '#f59e0b' },
    { label: 'Project Views', value: '1,280', icon: Rocket, color: '#ec4899' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      
      <main style={{ flex: 1, padding: '40px' }}>
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
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{campaign.title}</span>
        </div>

        {/* Header Section */}
        <header style={{ 
          background: '#fff', 
          padding: '32px', 
          borderRadius: '32px', 
          border: '1px solid #e2e8f0',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px', 
              background: `url(${campaign.coverImageUrl}) center/cover no-repeat`,
              border: '4px solid #f1f5f9'
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{campaign.title}</h1>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  background: '#dcfce7', 
                  color: '#166534', 
                  fontSize: '0.75rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {campaign.status}
                </span>
              </div>
              <p style={{ color: '#64748b', fontWeight: 500 }}>Campaign ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{id.slice(0, 8)}...</code></p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} /> Share
            </button>
            <a href={`/c/${campaign.slug}`} target="_blank" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <ExternalLink size={18} /> View Public Page
            </a>
          </div>
        </header>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '24px',
          marginBottom: '40px'
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ 
              background: '#fff', 
              padding: '24px', 
              borderRadius: '24px', 
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: `${stat.color}15`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={28} />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '32px', 
          borderBottom: '1px solid #e2e8f0', 
          marginBottom: '40px',
          padding: '0 8px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'updates', label: 'Project Updates', icon: MessageSquare },
            { id: 'spending', label: 'Spending Log', icon: Receipt },
            { id: 'backers', label: 'Backer List', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                color: activeTab === tab.id ? 'var(--accent-primary)' : '#64748b',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
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

        {/* Tab Content Section */}
        <section style={{ minHeight: '400px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Funding Velocity</h3>
                <div style={{ height: '300px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  [ Funding Chart Placeholder ]
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '32px', borderRadius: '32px', color: '#fff' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Campaign Goal</h3>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span>Progress</span>
                      <span>{Math.floor((parseFloat(campaign.raised || '0') / parseFloat(campaign.goalAmount || '1')) * 100)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(parseFloat(campaign.raised || '0') / parseFloat(campaign.goalAmount || '1')) * 100}%`, height: '100%', background: '#fff' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Target: ₦{parseFloat(campaign.goalAmount || '0').toLocaleString()}</p>
                </div>
                
                <div style={{ background: '#0f172a', padding: '32px', borderRadius: '32px', color: '#fff' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Ready to Withdraw?</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '24px', lineHeight: 1.6 }}>You have net funds available for withdrawal from your project escrow.</p>
                  <button className="btn-primary" style={{ width: '100%', background: '#fff', color: '#0f172a' }} onClick={() => router.push('/dashboard/wallet')}>
                    Go to Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <UpdateManager campaignId={id} />
          )}

          {activeTab === 'spending' && (
            <SpendingLogManager campaignId={id} />
          )}
        </section>
      </main>

      <style jsx>{`
        .btn-primary {
          background: var(--accent-primary);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }
        .btn-secondary {
          background: #fff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 12px 24px;
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
