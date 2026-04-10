import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { projectWallets } from '@/db/schema/projectWallets';
import { eq } from 'drizzle-orm';
import { getPublicUrl } from '@/lib/storage';

export const alt = 'Backr Campaign';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  // 1. Fetch Campaign Data
  const campaignsResult = await db
    .select({
      title: campaigns.title,
      coverImageUrl: campaigns.coverImageUrl,
      goalAmount: campaigns.goalAmount,
      creatorId: campaigns.creatorId,
    })
    .from(campaigns)
    .where(eq(campaigns.slug, params.slug))
    .limit(1);

  const campaign = campaignsResult[0];
  if (!campaign) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', background: '#0f172a', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <h1>Backr Campaign</h1>
        </div>
      ),
      { ...size }
    );
  }

  // 2. Fetch Creator and Wallet
  const [creator] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, campaign.creatorId))
    .limit(1);

  const [wallet] = await db
    .select({ totalReceived: projectWallets.totalReceived })
    .from(projectWallets)
    .where(eq(projectWallets.campaignId, (campaign as any).id || '')) // Slug check usually enough if we had ID, but here we need to map slug to ID properly
    .limit(1);

  // We actually need the ID to fetch the wallet. Let's re-fetch correctly.
  const fullCampaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.slug, params.slug),
    with: {
      wallet: true,
      creator: true,
    }
  });

  const title = fullCampaign?.title || 'Support this Campaign';
  const creatorName = (fullCampaign as any)?.creator?.displayName || 'a Backr Creator';
  const goal = parseFloat(fullCampaign?.goalAmount || '0');
  const raised = parseFloat((fullCampaign as any)?.wallet?.totalReceived || '0');
  const progress = Math.min(Math.round((raised / goal) * 100), 100);
  const coverUrl = getPublicUrl(fullCampaign?.coverImageUrl || null);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background Image */}
        {coverUrl && (
          <img
            src={coverUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9))',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 80px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: '#10b981',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: 24,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 20,
              textTransform: 'uppercase',
            }}
          >
            Backr Campaign
          </div>

          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#fff',
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>

          <p style={{ fontSize: 32, color: '#94a3b8', marginBottom: 60, fontWeight: 500 }}>
            by <span style={{ color: '#fff', fontWeight: 700 }}>{creatorName}</span>
          </p>

          {/* Progress Bar Container */}
          <div
            style={{
              width: '800px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 24, fontWeight: 600 }}>
                Progress: <span style={{ color: '#fff', fontWeight: 800 }}>{progress}%</span>
              </span>
              <span style={{ color: '#94a3b8', fontSize: 24, fontWeight: 600 }}>
                Raised: <span style={{ color: '#10b981', fontWeight: 800 }}>₦{raised.toLocaleString()}</span>
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 24,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(to right, #10b981, #34d399)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>
            Backr<span style={{ color: '#10b981' }}>.</span>com.ng
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
