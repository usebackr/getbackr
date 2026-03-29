import React from 'react';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { projectWallets } from '@/db/schema/projectWallets';
import { users } from '@/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

const categories = [
  { name: 'All', icon: '', active: true },
  { name: 'Film & Video', icon: '🎬', active: false },
  { name: 'Music', icon: '🎵', active: false },
  { name: 'Theatre', icon: '🎭', active: false },
  { name: 'Art & Design', icon: '🎨', active: false },
  { name: 'Games', icon: '🎮', active: false },
  { name: 'Technology', icon: '💡', active: false },
  { name: 'Fashion', icon: '👗', active: false },
  { name: 'Publishing', icon: '📚', active: false },
  { name: 'Food & Craft', icon: '🍳', active: false },
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
  Star: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export default async function ExplorePage() {
  const activeCampaigns = await db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      title: campaigns.title,
      description: campaigns.description,
      category: campaigns.category,
      coverImageUrl: campaigns.coverImageUrl,
      goalAmount: campaigns.goalAmount,
      endDate: campaigns.endDate,
      creatorName: users.displayName,
      raised: projectWallets.totalReceived,
    })
    .from(campaigns)
    .leftJoin(users, eq(users.id, campaigns.creatorId))
    .leftJoin(projectWallets, eq(projectWallets.campaignId, campaigns.id))
    .orderBy(desc(campaigns.createdAt))
    .limit(20);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
      <Sidebar />

      <main
        className="dash-main"
        style={{ flex: 1, background: '#ffffff', borderLeft: '1px solid #f1f5f9' }}
      >
        <header style={{ marginBottom: '32px' }}>
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
            ← Back to Dashboard
          </a>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#0f172a', fontWeight: 800 }}>
            Explore
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>Explore campaigns on Backr.</p>
        </header>

        {/* Search and Sort */}
        <div className="search-sort-container" style={{ marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '14px' }}>
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search campaigns..."
              className="search-input"
              style={{ paddingLeft: '48px' }}
            />
          </div>
          <button className="sort-button" style={{ height: '48px' }}>
            <Icons.Sort /> Sort
          </button>
        </div>



        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px',
            marginBottom: '24px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          className="hide-scrollbar"
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              style={{
                padding: '10px 20px',
                borderRadius: '24px',
                border: cat.active ? 'none' : '1px solid #f1f5f9',
                background: cat.active ? 'var(--accent-primary)' : '#f8fafc',
                color: cat.active ? '#ffffff' : '#475569',
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
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '24px',
          }}
        >
          {activeCampaigns.map((camp) => {
            const goal = parseFloat(camp.goalAmount);
            const raised = parseFloat(camp.raised || '0');
            const pct = Math.floor(Math.min((raised / goal) * 100, 100));
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
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '20px',
                          background: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      >
                        {camp.creatorName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: '#0f172a',
                            lineHeight: 1.2,
                          }}
                        >
                          {camp.creatorName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Individual</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div
                    style={{
                      height: '220px',
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
                    {camp.category && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(255,255,255,0.9)',
                          padding: '4px 16px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#475569',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {camp.category}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: '24px 20px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.25rem',
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
                        fontSize: '0.9rem',
                        color: '#64748b',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {camp.description ||
                        'Join me in bringing this highly anticipated project to life.'}
                    </p>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        marginBottom: '24px',
                        fontWeight: 500,
                      }}
                    >
                      Ends {daysLeft > 0 ? `in ${daysLeft} days` : 'soon'}
                    </p>

                    {/* Progress Stats */}
                    <div style={{ marginTop: 'auto' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          marginBottom: '8px',
                        }}
                      >
                        <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                          Goal ₦{raised.toLocaleString()} /{' '}
                          <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                            ₦{goal.toLocaleString()}
                          </span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                          {pct}%
                        </p>
                      </div>

                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          background: '#f1f5f9',
                          borderRadius: '4px',
                          marginBottom: '24px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--accent-primary)',
                            borderRadius: '4px',
                          }}
                        ></div>
                      </div>

                      {/* Inline Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                          className="btn-primary"
                          style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '1.05rem',
                            background: 'var(--accent-primary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Back Project
                        </button>
                        <button
                          style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: '1rem',
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Share Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
