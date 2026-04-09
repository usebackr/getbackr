'use client';

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

const categories = [
  { name: 'All' },
  { name: 'Theatre' },
  { name: 'Concerts' },
  { name: 'Events' },
  { name: 'Art Exhibition' },
  { name: 'Film & Video' },
  { name: 'Music' },
  { name: 'Photography' },
  { name: 'Art & Design' },
  { name: 'Fashion' },
  { name: 'Podcasts' },
  { name: 'Publishing' },
  { name: 'Food & Craft' },
  { name: 'Comics' },
];

const Icons = {
  Search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sort: () => (
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
      <line x1="21" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="3" y2="18" />
    </svg>
  ),
  Users: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

export default function ExploreClient({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'raised' | 'ending' | 'trending'>('trending');

  const filteredCampaigns = useMemo(() => {
    let list = [...initialCampaigns];

    // Filter by Search
    if (search) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by Category
    if (activeCategory !== 'All') {
      list = list.filter((c) => c.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'trending') {
        const aScore = (a.backers || 0) * 10 + parseFloat(a.raised || '0') / 1000;
        const bScore = (b.backers || 0) * 10 + parseFloat(b.raised || '0') / 1000;
        return bScore - aScore;
      }
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
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#ffffff',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      <Sidebar />

      <main
        className="dash-main"
        style={{
          flex: 1,
          background: '#ffffff',
          borderLeft: '1px solid #f1f5f9',
          overflowX: 'hidden',
        }}
      >
        <header style={{ marginBottom: '40px' }}>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '16px',
            }}
          >
            <Icons.ArrowLeft /> Back to Dashboard
          </a>
          <h1
            style={{ fontSize: '2.8rem', marginBottom: '8px', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.02em' }}
          >
            Explore Projects
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500, marginBottom: '32px' }}>
            Back the future of creative independence.
          </p>

          {/* Featured Hero */}
          {filteredCampaigns.length > 0 && activeCategory === 'All' && !search && (
            <div 
              style={{ 
                width: '100%', 
                height: '380px', 
                borderRadius: '32px', 
                background: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${filteredCampaigns[0].coverImageUrl}) center/cover no-repeat`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '40px',
                color: '#fff',
                marginBottom: '40px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: '40px', 
                left: '40px', 
                background: '#10b981', 
                color: '#fff', 
                padding: '6px 16px', 
                borderRadius: '20px', 
                fontSize: '0.85rem', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }} /> #1 TRENDING
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '12px', maxWidth: '600px', lineHeight: 1.1 }}>{filteredCampaigns[0].title}</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '500px', marginBottom: '24px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {filteredCampaigns[0].description}
              </p>
              <a 
                href={`/c/${filteredCampaigns[0].slug}`} 
                style={{ 
                  width: 'fit-content', 
                  padding: '14px 32px', 
                  borderRadius: '16px', 
                  background: '#fff', 
                  color: '#0f172a', 
                  fontWeight: 800, 
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                View Project Details <Icons.Search />
              </a>
            </div>
          )}
        </header>

        {/* Search and Sort */}
        <div
          className="search-sort-container"
          style={{
            marginBottom: '32px',
            display: 'flex',
            gap: '16px',
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
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
              style={{
                paddingLeft: '48px',
                width: '100%',
                height: '56px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            />
          </div>
          <select
            className="sort-button"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              height: '56px',
              padding: '0 20px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <option value="trending">Trending Now</option>
            <option value="newest">Newest First</option>
            <option value="raised">Most Funded</option>
            <option value="ending">Ending Soon</option>
          </select>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '24px',
          }}
          className="hide-scrollbar"
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat.name)}
              style={{
                padding: '10px 20px',
                borderRadius: '24px',
                border: activeCategory === cat.name ? 'none' : '1px solid #f1f5f9',
                background: activeCategory === cat.name ? 'var(--accent-primary)' : '#f8fafc',
                color: activeCategory === cat.name ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredCampaigns.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ transform: 'scale(3)', marginBottom: '32px', display: 'inline-block' }}>
              <Icons.Search />
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              No campaigns found matching your criteria.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '32px',
            }}
          >
            {filteredCampaigns.map((camp) => {
              const goal = parseFloat(camp.goalAmount || '1');
              const raised = parseFloat(camp.raised || '0');
              const actualPct = Math.floor((raised / goal) * 100);
              const visualPct = Math.min(actualPct, 100);
              const daysLeft = Math.ceil(
                (new Date(camp.endDate).getTime() - new Date().getTime()) / 86400000,
              );

              return (
                <a
                  key={camp.id}
                  href={`/c/${camp.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    className="explore-card"
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #f1f5f9',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        height: '200px',
                        width: '100%',
                        position: 'relative',
                        background: '#f1f5f9',
                      }}
                    >
                      {camp.coverImageUrl && (
                        <img
                          src={camp.coverImageUrl}
                          alt={camp.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(255,255,255,0.95)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: 'var(--accent-primary)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {camp.category}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '24px 20px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ fontSize: '1.25rem' }}>{/* Category icon removed */}</div>
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: '8px',
                          lineHeight: 1.3,
                        }}
                      >
                        {camp.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#64748b',
                          marginBottom: '16px',
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {camp.description}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '20px',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '16px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Icons.Users />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          <b>{camp.backers || 0}</b> backers
                        </span>
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ color: '#0f172a' }}>
                            ₦{raised.toLocaleString()}{' '}
                            <span style={{ fontWeight: 500, color: '#94a3b8' }}>
                              of ₦{goal.toLocaleString()}
                            </span>
                          </span>
                          <span style={{ color: 'var(--accent-primary)' }}>{actualPct}%</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: '#f1f5f9',
                            borderRadius: '3px',
                            marginBottom: '16px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${visualPct}%`,
                              height: '100%',
                              background: 'var(--accent-primary)',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Ends soon'}
                          </span>
                          <button
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#0f172a',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Back Project
                          </button>
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
