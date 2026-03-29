import React from 'react';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { eq, desc, sql } from 'drizzle-orm';

export default async function OngoingProjects() {
  // Pull live 'active' campaigns from DB
  const liveCampaigns = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      category: campaigns.category,
      goal: campaigns.goalAmount,
      raised: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
      image: campaigns.coverImageUrl,
      slug: campaigns.slug,
      backers: sql<number>`COUNT(DISTINCT ${contributions.backerEmail})::int`,
    })
    .from(campaigns)
    .leftJoin(
      contributions,
      sql`${contributions.campaignId} = ${campaigns.id} AND ${contributions.status} = 'confirmed'`,
    )
    .where(eq(campaigns.status, 'active'))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))
    .limit(6);

  // If DB is completely empty (like during early launch), we use mock data to keep the landing page looking premium.
  const displayProjects =
    liveCampaigns.length > 0
      ? liveCampaigns.map((c) => {
          const raisedNum = Number(c.raised) || 0;
          const goalNum = Number(c.goal) || 1;
          const progress = Math.min(100, Math.round((raisedNum / goalNum) * 100));
          return {
            title: c.title,
            category: c.category || 'Creator Project',
            raised: `₦${raisedNum.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            progress,
            image:
              c.image ||
              'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
            backers: c.backers,
            href: `/c/${c.slug}`,
          };
        })
      : [
          {
            title: 'Echoes of the Sahara',
            category: 'Music Documentary (Kano)',
            raised: '₦1,200,000',
            progress: 40,
            image:
              'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
            backers: 124,
            href: '/explore',
          },
          {
            title: 'Solar Pod — Clean Energy',
            category: 'Tech / Innovation (Lagos)',
            raised: '₦4,800,000',
            progress: 96,
            image:
              'https://images.unsplash.com/photo-1509391366360-fe5bb584850a?auto=format&fit=crop&q=80&w=800',
            backers: 450,
            href: '/explore',
          },
          {
            title: 'Street Art Lagos',
            category: 'Visual Arts (Surulere)',
            raised: '₦650,000',
            progress: 43,
            image:
              'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
            backers: 89,
            href: '/explore',
          },
        ];

  return (
    <section
      id="ongoing-projects"
      style={{ padding: 'clamp(60px, 10vw, 100px) 24px', background: '#ffffff' }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '60px',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3rem)',
                marginBottom: '12px',
                color: 'var(--accent-secondary)',
              }}
            >
              Live <span className="text-gradient">Campaigns</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Discover and back incredible creators from across Nigeria.
            </p>
          </div>
          <a
            href="/explore"
            className="btn-secondary"
            style={{ fontSize: '0.9rem', width: '100%', maxWidth: '200px', textAlign: 'center' }}
          >
            View All Projects
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '32px',
          }}
        >
          {displayProjects.map((project, idx) => (
            <a key={idx} href={project.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                className="card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div
                  style={{
                    height: '220px',
                    width: '100%',
                    background: `url(${project.image}) center/cover no-repeat`,
                  }}
                ></div>
                <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {project.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      {project.backers} backers
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.4rem',
                      marginBottom: '24px',
                      color: 'var(--accent-secondary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {project.title}
                  </h3>

                  <div style={{ marginTop: 'auto' }}>
                    <div
                      style={{
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${project.progress}%`,
                          height: '100%',
                          background: 'var(--accent-primary)',
                        }}
                      ></div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.05rem',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: 'var(--accent-secondary)' }}>
                        {project.raised}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {project.progress}% funded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
