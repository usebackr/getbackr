import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema/campaigns';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;

  const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, id) });
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const campaignUrl = `${appUrl}/campaigns/${campaign.slug}`;

  const tweetText = encodeURIComponent(`Support "${campaign.title}" on Backr — ${campaignUrl}`);
  const whatsappText = encodeURIComponent(
    `Check out this campaign on Backr: "${campaign.title}" — ${campaignUrl}`,
  );

  return NextResponse.json({
    twitter: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(campaignUrl)}`,
    whatsapp: `https://wa.me/?text=${whatsappText}`,
    copyUrl: campaignUrl,
  });
}
