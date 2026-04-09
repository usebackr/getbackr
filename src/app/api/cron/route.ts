import { NextRequest, NextResponse } from 'next/server';
import { runMaintenance } from '@/lib/cron/actions';

/**
 * GET /api/cron
 * Secured maintenance endpoint for Vercel Cron or GitHub Actions.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Simple security check using CRON_SECRET environment variable
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runMaintenance();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('[Cron Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
