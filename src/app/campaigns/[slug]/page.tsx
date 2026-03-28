import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';

interface PageProps {
  params: { slug: string };
}

async function getCampaignBySlug(slug: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.slug, slug),
  });
  if (!campaign) return null;

  const creator = await db.query.users.findFirst({
    where: eq(users.id, campaign.creatorId),
  });

  const wallet = await db.query.projectWallets.findFirst({
    where: eq(projectWallets.campaignId, campaign.id),
  });

  return { campaign, creator, wallet };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getCampaignBySlug(params.slug);
  if (!data) return { title: 'Campaign not found' };

  const { campaign } = data;
  const ogImage = campaign.ogImageUrl ?? campaign.coverImageUrl ?? undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    title: campaign.title,
    description: campaign.description ?? undefined,
    openGraph: {
      title: campaign.title,
      description: campaign.description ?? undefined,
      images: ogImage ? [{ url: ogImage }] : [],
      url: `${appUrl}/campaigns/${campaign.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: campaign.description ?? undefined,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function CampaignPage({ params }: PageProps) {
  const data = await getCampaignBySlug(params.slug);
  if (!data) notFound();

  // data is guaranteed non-null after notFound() above
  const { campaign, creator, wallet } = data!;

  const goalAmount = parseFloat(campaign.goalAmount);
  const totalReceived = wallet ? parseFloat(wallet.totalReceived) : 0;
  const progressPercent = goalAmount > 0 ? Math.min(100, (totalReceived / goalAmount) * 100) : 0;

  const endDate = new Date(campaign.endDate);
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const campaignUrl = `${appUrl}/campaigns/${campaign.slug}`;

  return (
    <main
      style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}
    >
      {campaign.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.coverImageUrl}
          alt={campaign.title}
          style={{
            width: '100%',
            borderRadius: 12,
            marginBottom: '1.5rem',
            objectFit: 'cover',
            maxHeight: 400,
          }}
        />
      )}

      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2744', marginBottom: '0.5rem' }}>
        {campaign.title}
      </h1>

      {creator && (
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          by <strong>{creator.displayName}</strong>
        </p>
      )}

      {campaign.description && (
        <p style={{ lineHeight: 1.7, color: '#333', marginBottom: '1.5rem' }}>
          {campaign.description}
        </p>
      )}

      {/* Funding progress */}
      <div
        style={{
          background: '#f5f5f5',
          borderRadius: 8,
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#1a2744' }}>
            {campaign.currency} {totalReceived.toLocaleString()} raised
          </span>
          <span style={{ color: '#666' }}>
            of {campaign.currency} {goalAmount.toLocaleString()} goal
          </span>
        </div>
        <div style={{ background: '#ddd', borderRadius: 4, height: 10, overflow: 'hidden' }}>
          <div
            style={{
              background: '#f5a623',
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          <span>{progressPercent.toFixed(1)}% funded</span>
          <span>{daysRemaining} days remaining</span>
        </div>
      </div>

      {/* CTA */}
      {campaign.status === 'active' && (
        <a
          href={`${campaignUrl}#contribute`}
          style={{
            display: 'inline-block',
            background: '#f5a623',
            color: '#1a2744',
            fontWeight: 700,
            padding: '0.875rem 2rem',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '1.1rem',
          }}
        >
          Back This Project
        </a>
      )}
    </main>
  );
}
