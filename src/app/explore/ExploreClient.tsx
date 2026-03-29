'use client';

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

const categories = [
  { name: 'All', icon: '' },
  { name: 'Film & Video', icon: '🎬' },
  { name: 'Music', icon: '🎵' },
  { name: 'Theatre', icon: '🎭' },
  { name: 'Art & Design', icon: '🎨' },
  { name: 'Games', icon: '🎮' },
  { name: 'Technology', icon: '💡' },
  { name: 'Fashion', icon: '👗' },
  { name: 'Publishing', icon: '📚' },
  { name: 'Food & Craft', icon: '🍳' },
];

const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sort: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="3" y2="18" />
    </svg>
  ),
};

export default function ExploreClient({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'raised' | 'ending'>('newest');

  const filteredCampaigns = useMemo(() => {
    let list = [...initialCampaigns];

    // Filter by Search
    if (search) {
      list = list.filter((c) => 
        c.title.toLowerCase().includes(search.toLowerCase()) || 
        c.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by Category
    if (activeCategory !== 'All') {
      list = list.filter((c) => c.category === activeCategory);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'raised') {
        return parseFloat(b.raised || '0') - parseFloat(a.raised || '0');
      }
      if (sortBy === 'ending') {
        const aDays = new Date(a.endDate).getTime() - new Date().getTime();
        const bDays = new Date(b.endDate).getTime() - new Date().getTime();
        return aDays - bDays;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return list;
  }, [search, activeCategory, sortBy, initialCampaigns]);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#ffffff',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <Sidebar />

      <main className="dash-main" style={{ flex: 1, background: '#ffffff', borderLeft: '1px solid #f1f5f9', overflowX: 'hidden' }}>
        <header style={{ marginBottom: '32px' }}>
          <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
            ← Back to Dashboard
          </a>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#0f172a', fontWeight: 900 }}>Explore Projects</h1>
          <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Find and back any creative project on the platform.</p>
        </header>

        {/* Search and Sort */}
        <div className="search-sort-container" style={{ marginBottom: '32px', display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '16px' }}>
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search for any project by name or keywords..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '48px', width: '100%', height: '56px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            />
          </div>
          <select 
            className="sort-button" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ 
              height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #e2e8f0', 
              background: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="raised">Most Funded</option>
            <option value="ending">Ending Soon</option>
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px' }} className="hide-scrollbar">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat.name)}
              style={{
                padding: '10px 20px', borderRadius: '24px',
                border: activeCategory === cat.name ? 'none' : '1px solid #f1f5f9',
                background: activeCategory === cat.name ? 'var(--accent-primary)' : '#f8fafc',
                color: activeCategory === cat.name ? '#ffffff' : '#475569',
                fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {filteredCampaigns.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No campaigns found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '32px' }}>
            {filteredCampaigns.map((camp) => {
              const goal = parseFloat(camp.goalAmount || '1');
              const raised = parseFloat(camp.raised || '0');
              const pct = Math.floor(Math.min((raised / goal) * 100, 100));
              const daysLeft = Math.ceil((new Date(camp.endDate).getTime() - new Date().getTime()) / 86400000);

              return (
                <a key={camp.id} href={`/c/${camp.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="explore-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s ease' }}>
                    <div style={{ height: '200px', width: '100%', position: 'relative', background: '#f1f5f9' }}>
                      {camp.coverImageUrl && <img src={camp.coverImageUrl} alt={camp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.95)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {camp.category}
                      </span>
                    </div>

                    <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>{camp.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{camp.description}</p>
                      
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                          <span style={{ color: '#0f172a' }}>₦{raised.toLocaleString()} <span style={{ fontWeight: 500, color: '#94a3b8' }}>raised</span></span>
                          <span style={{ color: 'var(--accent-primary)' }}>{pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{daysLeft > 0 ? `${daysLeft} days left` : 'Ends soon'}</span>
                          <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Back Project</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .explore-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: var(--accent-primary) !important; }
      `}</style>
    </div>
  );
}
