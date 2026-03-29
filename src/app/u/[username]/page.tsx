import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { campaigns } from '@/db/schema/campaigns';
import { contributions } from '@/db/schema/contributions';
import { eq, desc, sql, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

  // 1. Fetch User Data
  const [user] = await db
    .select()
    .from(users)
    .where(
      isUUID 
        ? eq(users.id, username)
        : eq(users.username, username.replace('%40', ''))
    )
    .limit(1);

  if (!user) notFound();

  // 2. Fetch User's Campaigns (Live and Closed)
  const creatorCampaigns = await db
    .select({
      id: campaigns.id,
      title: campaigns.title,
      slug: campaigns.slug,
      status: campaigns.status,
      category: campaigns.category,
      goal: campaigns.goalAmount,
      image: campaigns.coverImageUrl,
      raised: sql<number>`COALESCE(SUM(${contributions.amount}), 0)::numeric`,
      backers: sql<number>`COUNT(DISTINCT ${contributions.backerEmail})::int`,
    })
    .from(campaigns)
    .leftJoin(
      contributions,
      sql`${contributions.campaignId} = ${campaigns.id} AND ${contributions.status} = 'confirmed'`,
    )
    .where(and(eq(campaigns.creatorId, user.id)))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt));

  const socialLinks = (user.socialLinks as any) || {};

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(60px, 10vw, 120px) 24px' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div className="glass" style={{ 
          padding: '48px', 
          borderRadius: '32px', 
          background: '#ffffff', 
          marginBottom: '48px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          border: '1px solid #fff'
        }}>
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '70px', 
            margin: '0 auto 24px',
            background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : 'var(--accent-primary)',
            border: '6px solid #f1f5f9',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!user.avatarUrl && <span style={{ color: '#fff', fontSize: '3rem', fontWeight: 900 }}>{user.displayName.charAt(0)}</span>}
          </div>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>{user.displayName}</h1>
          <p style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '24px' }}>@{user.username}</p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 500 }}>
              {user.bio || 'This creator is building something incredible in Nigeria. Back their journey today.'}
            </p>
          </div>

          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {socialLinks.twitter && (
              <a 
                href={socialLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '100px', 
                  background: '#f1f5f9', 
                  color: '#475569', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                Twitter/X
              </a>
            )}
            {socialLinks.instagram && (
              <a 
                href={socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '100px', 
                  background: '#f1f5f9', 
                  color: '#475569', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                Instagram
              </a>
            )}
            {socialLinks.linkedin && (
              <a 
                href={socialLinks.linkedin} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '100px', 
                  background: '#f1f5f9', 
                  color: '#475569', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                LinkedIn
              </a>
            )}
            {socialLinks.website && (
              <a 
                href={socialLinks.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '100px', 
                  background: '#0f172a', 
                  color: '#ffffff', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                Website
              </a>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '64px' }}>
          <div className="dash-card" style={{ textAlign: 'center', padding: '32px' }}>
            <h4 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>Total Projects</h4>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{creatorCampaigns.length}</span>
          </div>
          <div className="dash-card" style={{ textAlign: 'center', padding: '32px' }}>
            <h4 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>Member Since</h4>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{new Date(user.createdAt).getFullYear()}</span>
          </div>
          <div className="dash-card" style={{ textAlign: 'center', padding: '32px' }}>
             <h4 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>Identity</h4>
             <span style={{ 
               fontSize: '1rem', 
               fontWeight: 800, 
               color: user.kycStatus === 'verified' ? '#10b981' : '#f59e0b',
               padding: '4px 12px',
               borderRadius: '20px',
               background: user.kycStatus === 'verified' ? '#ecfdf5' : '#fff7ed',
               display: 'inline-block'
             }}>
               {user.kycStatus === 'verified' ? '✓ Verified' : 'Pending Verification'}
             </span>
          </div>
        </div>

        {/* Campaigns Section */}
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '32px', color: '#0f172a' }}>Campaigns by {user.displayName}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {creatorCampaigns.map((c) => {
            const progress = Math.min(100, Math.round((Number(c.raised) / Number(c.goal)) * 100));
            return (
              <Link key={c.id} href={`/c/${c.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card-premium" style={{ height: '100%', border: '1px solid #e2e8f0' }}>
                  <div className="card-image-container" style={{ backgroundImage: `url(${c.image || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800'})`, height: '200px' }}>
                     <div className="card-badge">{c.category}</div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title" style={{ fontSize: '1.2rem' }}>{c.title}</h3>
                    <div className="card-progress-section">
                       <div className="card-progress-bg">
                         <div className="card-progress-fill" style={{ width: `${progress}%` }}></div>
                       </div>
                       <div className="card-stats">
                         <span className="card-raised">₦{Number(c.raised).toLocaleString()}</span>
                         <span className="card-percent">{progress}% funded</span>
                       </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
