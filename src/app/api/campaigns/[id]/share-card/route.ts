import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';
import { users } from '@/db/schema/users';
import { uploadFile } from '@/lib/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const creator = await db.query.users.findFirst({ where: eq(users.id, campaign.creatorId) });

  // Dynamically import @vercel/og to avoid JSX parse issues in .ts files
  const { ImageResponse } = await import('@vercel/og');

  const goalFormatted = `${campaign.currency} ${parseFloat(campaign.goalAmount).toLocaleString()}`;
  const creatorName = creator?.displayName ?? '';
  const campaignTitle = campaign.title;

  const imageResponse = new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1a2744',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        },
        children: [
          // Header branding
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: 12 },
              children: {
                type: 'div',
                props: {
                  style: {
                    background: '#f5a623',
                    color: '#1a2744',
                    fontWeight: 900,
                    fontSize: 28,
                    padding: '6px 18px',
                    borderRadius: 8,
                  },
                  children: 'Backr',
                },
              },
            },
          },
          // Campaign title + creator
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: 16 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#ffffff',
                      fontSize: 56,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      maxWidth: 900,
                    },
                    children: campaignTitle,
                  },
                },
                creatorName
                  ? {
                      type: 'div',
                      props: {
                        style: { color: '#f5a623', fontSize: 28, fontWeight: 600 },
                        children: `by ${creatorName}`,
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },
          // Footer: goal + branding
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: 4 },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { color: '#aab4cc', fontSize: 18 },
                          children: 'Funding Goal',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { color: '#f5a623', fontSize: 40, fontWeight: 800 },
                          children: goalFormatted,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'div',
                  props: { style: { color: '#aab4cc', fontSize: 20 }, children: 'backr.app' },
                },
              ],
            },
          },
        ],
      },
    } as any,
    { width: 1200, height: 630 },
  );

  // Convert to buffer and store in S3
  try {
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const s3Key = `og-images/${id}.png`;

    await uploadFile(buffer, s3Key, 'image/png');

    await db
      .update(campaigns)
      .set({ ogImageUrl: s3Key, updatedAt: new Date() })
      .where(eq(campaigns.id, id));

    return NextResponse.json({ ogImageUrl: s3Key });
  } catch (err) {
    console.error('[share-card] Failed to store OG image:', err);
    return NextResponse.json({ error: 'Failed to generate or store OG image' }, { status: 500 });
  }
}
