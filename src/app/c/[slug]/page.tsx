import { notFound } from 'next/navigation';
import Link from 'next/link';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { spendingLogs } from '@/db/schema/spendingLogs';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import CheckoutForm from './CheckoutForm';
import ShareButton from './ShareButton';
import TransparencyLedger from './TransparencyLedger';
import BackersList from './BackersList';
import { getPublicUrl } from '@/lib/storage';

export default async function CampaignPublicPage({ params }: { params: { slug: string } }) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, params.slug))
    .limit(1);

  if (!campaign) notFound();

  // Increment view count in background - wrapped in try/catch for stability
  try {
    await db.update(campaigns)
      .set({ views: sql`${campaigns.views} + 1` })
      .where(eq(campaigns.id, campaign.id));
  } catch (err) {
    console.error('[Views] Column might be missing, skipping increment:', err);
  }

  const [creator] = await db
    .select({ 
      displayName: users.displayName, 
      avatarUrl: users.avatarUrl,
      username: users.username
    })
    .from(users)
    .where(eq(users.id, campaign.creatorId))
    .limit(1);

  // Apply self-healing URLs
  const coverUrl = getPublicUrl(campaign.coverImageUrl);
  const avatarUrl = getPublicUrl(creator?.avatarUrl);

  const [wallet] = await db
    .select()
    .from(projectWallets)
    .where(eq(projectWallets.campaignId, campaign.id))
    .limit(1);

  const logs = await db
    .select({
      id: spendingLogs.id,
      amount: spendingLogs.amount,
      description: spendingLogs.description,
      entryDate: spendingLogs.entryDate,
      withdrawalStatus: withdrawals.status,
    })
    .from(spendingLogs)
    .leftJoin(withdrawals, eq(spendingLogs.withdrawalId, withdrawals.id))
    .where(
      and(
        eq(spendingLogs.campaignId, campaign.id),
        or(
          sql`${spendingLogs.withdrawalId} IS NULL`,
          inArray(withdrawals.status, ['processing', 'completed'])
        )
      )
    )
    .orderBy(desc(spendingLogs.entryDate));

  const campaignContributions = await db
    .select()
    .from(contributions)
    .where(and(eq(contributions.campaignId, campaign.id), eq(contributions.status, 'confirmed')))
    .orderBy(desc(contributions.createdAt));

  const comments = campaignContributions
    .filter(c => c.message && c.message.trim() !== '')
    .map(c => ({
      id: c.id,
      backerName: c.backerName || (c.anonymous ? 'Anonymous Supporter' : 'A Supporter'),
      message: c.message,
      createdAt: c.createdAt
    }));

  const totalDonors = campaignContributions.length;
  // Map contributions correctly for the BackersList
  const latestBackers = campaignContributions.slice(0, 10).map(c => ({
    id: c.id,
    backerName: c.backerName || (c.anonymous ? 'Anonymous Supporter' : 'A Supporter'),
    amount: c.amount,
    isAnonymous: c.anonymous,
    createdAt: c.createdAt
  }));

  const goalAmount = parseFloat(campaign.goalAmount);
  const raisedAmount = parseFloat(wallet?.totalReceived || '0');

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
          padding: '0 24px',
          height: '72px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <a
            href="/explore"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              color: '#475569',
              textDecoration: 'none',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s'
            }}
            title="Back to Explore"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </a>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'var(--accent-primary)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
              backr
            </h2>
          </a>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href="/dashboard"
            className="btn-primary"
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Dashboard
          </a>
        </div>
      </header>

      <main 
        className="container"
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '40px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '40px'
        }}
      >
        {/* Left Column: Media & Story */}
        <div style={{ flex: '1 1 600px', maxWidth: '800px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Link 
                href={creator?.username ? `/u/${creator.username}` : `/u/${campaign.creatorId}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '24px',
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                  }}
                >
                  {!avatarUrl && (creator?.displayName?.charAt(0) || 'C')}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: 0 }}>
                    {creator?.displayName || 'Unknown Creator'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, margin: 0 }}>
                     View Profile →
                  </p>
                </div>
              </Link>
            </div>

            {/* Campaign Banner */}
            <div
              style={{
                width: 'calc(100% + 48px)',
                marginLeft: '-24px',
                height: '400px',
                background: '#f1f5f9',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '32px',
              }}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={campaign.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {campaign.category}
                </span>
              )}
            </div>

            {/* Campaign Body */}
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>
                {campaign.title}
              </h1>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#475569',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  marginBottom: '32px',
                }}
              >
                {campaign.description || 'No description provided.'}
              </p>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ShareButton
                  title={`Back ${campaign.title} on Backr`}
                  text={campaign.description || 'Support this awesome campaign!'}
                  url={`/c/${campaign.slug}`}
                />
              </div>
            </div>
          </div>

          {/* Transparency Ledger & Comments section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Transparency Ledger */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Transparency Ledger 🇳🇬
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
                See exactly how the creator is using the raised funds.
              </p>
              <TransparencyLedger logs={logs.map(l => ({ ...l, type: 'withdrawal' }))} />
            </div>

            {/* Comments Section */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>
                Words of Support ({comments.length})
              </h3>
              {comments.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No comments yet. Be the first to cheer them on!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '0.95rem' }}>
                        {comment.backerName}
                      </p>
                      <p style={{ color: '#475569', lineHeight: 1.6, fontSize: '1rem', fontStyle: 'italic' }}>
                        "{comment.message}"
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form & Latest Backers */}
        <div style={{ flex: '1 1 350px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
