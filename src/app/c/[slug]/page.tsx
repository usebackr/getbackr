import React from 'react';
import { notFound } from 'next/navigation';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { spendingLogs } from '@/db/schema/spendingLogs';
import { contributions } from '@/db/schema/contributions';
import CheckoutForm from './CheckoutForm';
import ShareButton from './ShareButton';
import TransparencyLedger from './TransparencyLedger';
import BackersList from './BackersList';

export default async function CampaignPublicPage({ params }: { params: { slug: string } }) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, params.slug))
    .limit(1);

  if (!campaign) notFound();

  const [creator] = await db
    .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, campaign.creatorId))
    .limit(1);

  const [wallet] = await db
    .select()
    .from(projectWallets)
    .where(eq(projectWallets.campaignId, campaign.id))
    .limit(1);

  const logs = await db
    .select()
    .from(spendingLogs)
    .where(eq(spendingLogs.campaignId, campaign.id))
    .orderBy(spendingLogs.entryDate);

  const campaignContributions = await db
    .select()
    .from(contributions)
    .where(and(eq(contributions.campaignId, campaign.id), eq(contributions.status, 'confirmed')))
    .orderBy(desc(contributions.createdAt));

  const totalDonors = campaignContributions.length;
  const latestBackers = campaignContributions.slice(0, 10);

  const goalAmount = parseFloat(campaign.goalAmount);
  const raisedAmount = parseFloat(wallet?.totalReceived || '0');

  const Icons = {
    Star: () => (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Minimal Top Nav */}
      <header
        className="campaign-header"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a
            href="/explore"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            ← Back
          </a>
          <a href="/explore" style={{ textDecoration: 'none', color: 'var(--accent-primary)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>
              backr
            </h2>
          </a>
        </div>
        <a
          href="/dashboard"
          className="btn-primary"
          style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.95rem' }}
        >
          Go to dashboard
        </a>
      </header>

      <main className="campaign-main">
        {/* Left Column: Media & Story */}
        <div style={{ flex: '1 1 600px', maxWidth: '800px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Back Project</h1>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Creator Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '24px',
                    background: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {creator?.displayName?.charAt(0) || 'C'}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {creator?.displayName || 'Unknown Creator'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Individual</p>
                </div>
              </div>
            </div>

            {/* Huge Banner Image */}
            <div
              style={{
                width: 'calc(100% + 48px)',
                marginLeft: '-24px',
                height: '360px',
                background: '#e2e8f0',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '32px',
              }}
            >
              {campaign.coverImageUrl ? (
                <img
                  src={campaign.coverImageUrl}
                  alt={campaign.title}
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
                    color: '#94a3b8',
                  }}
                >
                  No Cover Image
                </div>
              )}
              {campaign.category && (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '24px',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                  }}
                >
                  {campaign.category}
                </span>
              )}
            </div>

            {/* Campaign Body */}
            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                }}
              >
                {campaign.title}
              </h2>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                }}
              >
                {campaign.description || 'No description provided.'}
              </p>

              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <ShareButton
                  title={`Back ${campaign.title} on Backr`}
                  text={campaign.description || 'Support this awesome campaign!'}
                  url={`/c/${campaign.slug}`}
                />
                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Report Organizer
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '24px',
              }}
            >
              0 Comments
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No comments yet.</p>
            </div>
          </div>

          {/* Transparency Ledger */}
          <div style={{ marginTop: '48px' }}>
            <h3
              style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}
            >
              Transparency Ledger
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
              See exactly how the creator is using the raised funds.
            </p>

            <TransparencyLedger logs={logs} />
          </div>
        </div>

        {/* Right Column: Checkout Form & Latest Backers */}
        <div
          style={{
            flex: '1 1 400px',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <CheckoutForm
            campaignId={campaign.id}
            goalAmount={goalAmount}
            raisedAmount={raisedAmount}
          />

          <BackersList 
            backers={latestBackers as any} 
            totalDonors={totalDonors} 
          />
        </div>
      </main>
    </div>
  );
}
