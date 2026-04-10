import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { spendingLogs } from '@/db/schema/spendingLogs';
import { campaignUpdates } from '@/db/schema/campaignUpdates';
import { contributions } from '@/db/schema/contributions';
import { withdrawals } from '@/db/schema/withdrawals';
import CheckoutForm from './CheckoutForm';
import ShareButton from './ShareButton';
import TransparencyLedger from './TransparencyLedger';
import BackersList from './BackersList';
import BackToDashboardButton from '@/components/dashboard/BackToDashboardButton';
import BrandLogo from '@/components/BrandLogo';
import { getPublicUrl } from '@/lib/storage';
import { Megaphone, ShieldCheck, ChevronLeft } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import RealtimeListener from '@/components/RealtimeListener';
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const [campaign] = await db
    .select({
      title: campaigns.title,
      description: campaigns.description,
      creatorId: campaigns.creatorId,
    })
    .from(campaigns)
    .where(eq(campaigns.slug, params.slug))
    .limit(1);

  if (!campaign) return { title: 'Campaign Not Found | Backr' };

  const [creator] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, campaign.creatorId))
    .limit(1);

  const title = `${campaign.title} | Backr`;
  const campaignDesc = campaign.description || '';
  const description = `Help ${creator?.displayName || 'a Backr Creator'} achieve their goal: ${campaignDesc.slice(0, 150)}${campaignDesc.length > 150 ? '...' : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://findbackr.com.ng/c/${params.slug}`,
      images: [`/c/${params.slug}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/c/${params.slug}/opengraph-image`],
    },
  };
}

export default async function CampaignPublicPage({ params }: { params: { slug: string } }) {
  let campaign: any = null;
  let creator: any = null;
  let wallet: any = null;
  let logs: any[] = [];
  let campaignContributions: any[] = [];
  let latestBackers: any[] = [];
  let goalAmount = 0;
  let raisedAmount = 0;
  let comments: any[] = [];
  let totalDonors = 0;
  let coverUrl: string | null = null;
  let avatarUrl: string | null = null;
  let updates: any[] = [];

  const campaignsResult = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, params.slug))
    .limit(1);

  campaign = campaignsResult[0];

  if (!campaign) notFound();

  try {
    // 1. Fetch Creator & Basic Media
    const creatorsResult = await db
      .select({
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        username: users.username,
        kycStatus: users.kycStatus,
      })
      .from(users)
      .where(eq(users.id, campaign.creatorId))
      .limit(1);

    creator = creatorsResult[0];
    coverUrl = getPublicUrl(campaign.coverImageUrl);
    avatarUrl = getPublicUrl(creator?.avatarUrl);

    // 2. Fetch Project Wallet & Goal Stats
    const walletsResult = await db
      .select()
      .from(projectWallets)
      .where(eq(projectWallets.campaignId, campaign.id))
      .limit(1);

    wallet = walletsResult[0];
    goalAmount = parseFloat(campaign.goalAmount);
    raisedAmount = parseFloat(wallet?.totalReceived || '0');

    // 3. Increment views (silent fail)
    db.update(campaigns)
      .set({ views: sql`${campaigns.views} + 1` })
      .where(eq(campaigns.id, campaign.id))
      .catch((err) => console.error('[Views] Increment failed:', err));

    // 4. Fetch Secondary Data (Updates, Logs, Backers)
    // Wrap these in a sub-try-catch to ensure the page renders even if these fail
    try {
      [updates, logs, campaignContributions] = await Promise.all([
        db
          .select()
          .from(campaignUpdates)
          .where(and(eq(campaignUpdates.campaignId, campaign.id), sql`deleted_at IS NULL`))
          .orderBy(desc(campaignUpdates.createdAt)),

        db
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
                inArray(withdrawals.status, ['processing', 'completed']),
              ),
            ),
          )
          .orderBy(desc(spendingLogs.entryDate)),

        db
          .select()
          .from(contributions)
          .where(
            and(eq(contributions.campaignId, campaign.id), eq(contributions.status, 'confirmed')),
          )
          .orderBy(desc(contributions.createdAt)),
      ]);
    } catch (dataErr) {
      console.error('[CampaignPublicPage] Data fetch error:', dataErr);
      updates = [];
      logs = [];
      campaignContributions = [];
    }

    // Process list data
    comments = (campaignContributions || [])
      .filter((c) => c.message && c.message.trim() !== '')
      .map((c) => ({
        id: c.id,
        backerName: c.backerName || (c.anonymous ? 'Anonymous Supporter' : 'A Supporter'),
        message: c.message,
        createdAt: c.createdAt,
      }));

    totalDonors = (campaignContributions || []).length;
    latestBackers = (campaignContributions || []).slice(0, 10).map((c) => ({
      id: c.id,
      backerName: c.backerName || (c.anonymous ? 'Anonymous Supporter' : 'A Supporter'),
      amount: c.amount,
      isAnonymous: c.anonymous,
      createdAt: c.createdAt,
    }));
  } catch (error) {
    console.error('[CampaignPublicPage] Critical Error:', error);
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: '#fff',
            borderRadius: '24px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            maxWidth: '500px',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>
            Campaign Unavailable
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '32px' }}>
            We&apos;re having trouble loading some details for this campaign. Please try refreshing
            or check back later.
          </p>
          <a
            href="/explore"
            className="btn-primary"
            style={{ padding: '12px 32px', borderRadius: '12px', textDecoration: 'none' }}
          >
            Back to Explore
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <RealtimeListener campaignId={campaign.id} />
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
          <BrandLogo fontSize="1.5rem" />
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Notification placeholders if needed to match footer/speed 2 exactly */}
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
          gap: '40px',
        }}
      >
        <div style={{ width: '100%' }}>
          <BackToDashboardButton to="/explore" label="Explore" />
        </div>
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}
            >
              <Link
                href={creator?.username ? `/u/@${creator.username}` : `/u/${campaign.creatorId}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '24px',
                    background: avatarUrl
                      ? `url(${avatarUrl}) center/cover`
                      : 'var(--accent-primary)',
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
                  <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {creator?.displayName || 'Unknown Creator'}
                    {creator?.kycStatus === 'verified' && <VerifiedBadge size={18} />}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {campaign.category}
                </span>
              )}
            </div>

            {/* Campaign Body */}
            <div>
              <h1
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginBottom: '16px',
                }}
              >
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

              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <ShareButton
                  title={campaign.title}
                  text={campaign.description || 'Support this awesome campaign!'}
                  url={`/c/${campaign.slug}`}
                  creatorName={creator?.displayName}
                  progressPercent={Math.min(Math.round((raisedAmount / goalAmount) * 100), 100)}
                />
              </div>
            </div>
          </div>

          {/* Project Updates Section */}
          {updates && updates.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Project Updates <Megaphone size={20} className="text-emerald-500" />
                </h3>
                <span
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {updates.length} {updates.length === 1 ? 'Update' : 'Updates'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {updates.map((update: any) => (
                  <div
                    key={update.id}
                    style={{
                      borderLeft: '3px solid var(--accent-primary)',
                      paddingLeft: '24px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        background: 'var(--accent-primary)',
                        borderRadius: '6px',
                        position: 'absolute',
                        left: '-7.5px',
                        top: '0',
                      }}
                    />
                    <h4
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        marginBottom: '8px',
                      }}
                    >
                      {update.title}
                    </h4>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#475569',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        marginBottom: '12px',
                      }}
                    >
                      {update.body}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                      Posted on{' '}
                      {new Date(update.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparency Ledger & Comments section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Transparency Ledger */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px',
              }}
            >
              <h3
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Transparency Ledger <ShieldCheck size={20} className="text-emerald-500" />
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
                See exactly how the creator is using the raised funds.
              </p>
              <TransparencyLedger logs={logs.map((l) => ({ ...l, type: 'withdrawal' }))} />
            </div>

            {/* Comments Section */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px',
              }}
            >
              <h3
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '24px',
                }}
              >
                Words of Support ({comments.length})
              </h3>
              {comments.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  No comments yet. Be the first to cheer them on!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '8px',
                          fontSize: '0.95rem',
                        }}
                      >
                        {comment.backerName}
                      </p>
                      <p
                        style={{
                          color: '#475569',
                          lineHeight: 1.6,
                          fontSize: '1rem',
                          fontStyle: 'italic',
                        }}
                      >
                        &quot;{comment.message}&quot;
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
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
        <div
          style={{
            flex: '1 1 350px',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading checkout...</div>}>
            <CheckoutForm
              campaignId={campaign.id}
              campaignSlug={campaign.slug}
              goalAmount={goalAmount}
              raisedAmount={raisedAmount}
              isClosed={campaign.status === 'closed'}
            />
          </Suspense>

          <BackersList backers={latestBackers as any} totalDonors={totalDonors} />
        </div>
      </main>
    </div>
  );
}
