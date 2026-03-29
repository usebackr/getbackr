import React from 'react';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { eq, desc, sql, or } from 'drizzle-orm';

export default async function OngoingProjects() {
  // Pull live 'active' or 'draft' (for testing/launch phase) campaigns from DB
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
    .where(or(eq(campaigns.status, 'active'), eq(campaigns.status, 'draft')))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))
    .limit(6);

  const displayProjects =
    liveCampaigns.length > 0
      ? liveCampaigns.map((c) => {
          const raisedNum = Number(c.raised) || 0;
          const goalNum = Number(c.goal) || 1;
          const progress = Math.min(100, Math.round((raisedNum / goalNum) * 100));
          return {
            title: c.title,
            category: c.category || 'Creator Project',
            raised: `₦${raisedNum.toLocaleString()}`,
            progress,
            image: c.image || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
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
            image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
            backers: 124,
            href: '/explore',
          },
          {
            title: 'Solar Pod — Clean Energy',
            category: 'Tech / Innovation (Lagos)',
            raised: '₦4,800,000',
            progress: 96,
            image: 'https://images.unsplash.com/photo-1509391366360-fe5bb584850a?auto=format&fit=crop&q=80&w=800',
            backers: 450,
            href: '/explore',
          },
        ];

  return (
    <section id="ongoing-projects" style={{ padding: 'clamp(80px, 12vw, 160px) 24px', background: '#ffffff' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '16px', color: 'var(--accent-secondary)', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Live <span className="text-gradient">Campaigns</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>
              Discover and back incredible creators from across Nigeria.
            </p>
          </div>
          <a href="/explore" className="btn-secondary" style={{ padding: '14px 40px', fontSize: '1rem', width: '100%', maxWidth: '240px', textAlign: 'center' }}>
            View All Projects
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '40px' }}>
          {displayProjects.map((project, idx) => (
            <a key={idx} href={project.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="card-premium">
                <div className="card-image-container" style={{ backgroundImage: `url(${project.image})` }}>
                  <div className="card-badge">{project.category}</div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{project.title}</h3>
                  <div className="card-meta">
                    <span className="card-backers"><b>{project.backers}</b> backers</span>
                  </div>
                  
                  <div className="card-progress-section">
                    <div className="card-progress-bg">
                      <div className="card-progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <div className="card-stats">
                      <span className="card-raised">{project.raised}</span>
                      <span className="card-percent">{project.progress}% funded</span>
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
