import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auditLogs } from '@/db/schema/auditLogs';
import { reconcilePendingPayments } from '@/lib/cron/actions';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { verifyAdminApi } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reconcile
 * Secure endpoint to manually trigger the payment reconciliation audit.
 */
export async function POST(req: NextRequest) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode token to get actor ID for audit logging
    let actorId: string | undefined;
    try {
      if (token) {
        const payload = verifyAccessToken(token);
        actorId = payload.sub as string;
      }
    } catch (e) {
      // Graceful fallback if token is invalid but isAdmin passed (unexpected)
    }

    console.log('[Admin Reconcile] Starting manual reconciliation triggered by:', actorId || 'Unknown');

    let reference: string | undefined;
    try {
      const body = await req.json();
      reference = body.reference;
    } catch (e) {
      // Optional body
    }

    const result = await reconcilePendingPayments(reference);

    // Log the event
    await db.insert(auditLogs).values({
      actorId: actorId || null,
      eventType: 'manual_payment_reconciliation',
      resourceType: 'contribution',
      metadata: {
        checked: result.checked,
        processed: result.processed,
        failed: result.failed,
        processedRefs: result.processedRefs,
      },
    });

    return NextResponse.json({
      success: true,
      summary: `Checked ${result.checked} payments, recovered ${result.processed}.`,
      details: result,
    });
  } catch (error: any) {
    console.error('[Admin Reconcile] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during reconciliation' },
      { status: 500 },
    );
  }
}
