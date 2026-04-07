export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  try {
    const token = cookies().get('accessToken')?.value;
    const isAdmin = await verifyAdminApi(token);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const resendKey = process.env.RESEND_API_KEY || '';
    const emailFrom = process.env.EMAIL_FROM || 'NOT_SET';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET';

    const diagnostics = {
      resendKeyPresent: resendKey.length > 0,
      resendKeyPrefix: resendKey ? `${resendKey.substring(0, 5)}...` : 'NONE',
      emailFrom,
      appUrl,
      nodeEnv: process.env.NODE_ENV,
    };

    let resendError = null;
    let resendResponse = null;

    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const { data, error } = await resend.emails.send({
          from: emailFrom,
          to: 'usebackr@gmail.com',
          subject: '🔍 Backr Email Diagnostic Test',
          html: `<p>If you see this, your email engine is <strong>successfully</strong> connected to <code>findbackr.com.ng</code>.</p>`,
        });
        resendResponse = data;
        resendError = error;
      } catch (e: any) {
        resendError = e.message;
      }
    }

    return NextResponse.json({
      success: !resendError,
      diagnostics,
      resendResponse,
      resendError,
      instruction: 'If Resend returns an error about "Unauthorized sender", double check that your EMAIL_FROM matches exactly what you verified in Resend.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
