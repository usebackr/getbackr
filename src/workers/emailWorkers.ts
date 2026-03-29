import sgMail from '@sendgrid/mail';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

// Initialise SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? '';
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@backr.app';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// ---------------------------------------------------------------------------
// 22.1 — email:receipt worker
// Handles contribution receipts and withdrawal OTP emails.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Email Template Styling (Customise styles here)
// ---------------------------------------------------------------------------
const BRAND_COLOR = '#10b981';
const BG_COLOR = '#f1f5f9';
const CARD_BG = '#ffffff';

const emailWrapperStyle = `
  background-color: ${BG_COLOR}; 
  padding: 40px 10px; 
  font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, helvetica, arial, sans-serif;
  color: #0f172a;
  line-height: 1.6;
`;

const emailCardStyle = `
  max-width: 540px; 
  margin: 0 auto; 
  background-color: ${CARD_BG}; 
  border-radius: 20px; 
  padding: 48px 32px; 
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
`;

export interface ReceiptJobData {
  contributionId?: string;
  backerEmail?: string;
  amount?: string | number;
  currency?: string;
  campaignTitle?: string;
  type?: 'donor_receipt' | 'creator_alert' | 'withdrawal_otp' | 'payment_approved' | 'kyc_approved' | 'withdrawal_rejected' | 'kyc_rejected';
  userId?: string;
  email?: string;
  otp?: string;
  rejectionReason?: string;
  // Extra data for creator alert
  creatorName?: string;
  backerName?: string;
  totalRaised?: string | number;
  goalAmount?: string | number;
  campaignUrl?: string;
}

/**
 * Direct Send Utility — Use this for instant delivery in Serverless (Vercel)
 */
export async function sendEmail(data: ReceiptJobData) {
  const { 
    type, amount, currency, campaignTitle, backerEmail, email, otp,
    creatorName, backerName, totalRaised, goalAmount, campaignUrl,
    rejectionReason
  } = data;

  if (!SENDGRID_API_KEY) {
    console.error('[Email Utility] SENDGRID_API_KEY is missing.');
    return { sent: false, error: 'Missing API key' };
  }

  try {
    // 1. Withdrawal OTP
    if (type === 'withdrawal_otp') {
      const to = email;
      if (!to) throw new Error('Missing email for withdrawal OTP');
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: '🔒 Your Backr Withdrawal security code',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 24px;">Confirm Your Withdrawal</h2>
              <p>Your one-time security code for campaign <strong>${campaignTitle ?? 'your campaign'}</strong> is:</p>
              <div style="background: #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin: 32px 0;">
                <h1 style="letter-spacing: 12px; font-size: 2.5rem; margin: 0; color: ${BRAND_COLOR};">${otp}</h1>
              </div>
              <p style="font-size: 0.9rem; color: #64748b;">This code expires in 10 minutes. Please keep it confidential.</p>
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                &copy; 2026 Backr.app
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 2. Withdrawal Approved (Payment Approved)
    if (type === 'payment_approved') {
      const to = email || backerEmail;
      if (!to) throw new Error('Missing email for approval notification');
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: '✅ Payout Approved: Your funds have been sent! 🚀',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #ecfdf5; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">✅</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Payout Approved</h2>
              <p>Great news! Your withdrawal request for <strong>₦${Number(amount).toLocaleString()}</strong> has been approved and the transfer has been initiated.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p><strong>Campaign:</strong> ${campaignTitle || 'Your Campaign'}</p>
              <p><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
              <p><strong>Status:</strong> Transferred</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="font-size: 0.9rem; color: #64748b;">Funds typically arrive within 24-48 business hours depending on your bank.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://backr.app/dashboard/wallet" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  View Transaction History
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 3. Withdrawal Rejected
    if (type === 'withdrawal_rejected') {
      const to = email || backerEmail;
      if (!to) throw new Error('Missing email for rejection notification');
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: '⚠️ Update on your withdrawal request',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #fef2f2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">⚠️</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Withdrawal Rejected</h2>
              <p>Your withdrawal request for <strong>₦${Number(amount).toLocaleString()}</strong> was unfortunately not approved at this time.</p>
              <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-weight: 700; color: #991b1b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Reason for Rejection:</p>
                <p style="margin: 8px 0 0; color: #0f172a;">${rejectionReason || 'No specific reason provided. Please contact support.'}</p>
              </div>
              <p>Your funds have been returned to your project wallet. You can review the feedback above and submit a new request once the issues are addressed.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://backr.app/dashboard/wallet" style="display:inline-block; padding:14px 32px; border: 2px solid ${BRAND_COLOR}; color: ${BRAND_COLOR}; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Return to Wallet
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 4. KYC Approved
    if (type === 'kyc_approved') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC approval');
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: '✨ Your Identity has been Verified! 🔐',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #f0fdf4; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">✨</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Verification Successful</h2>
              <p>Hi there! We've successfully reviewed your identity documents. Your account is now fully verified.</p>
              <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
                <p style="margin: 0; color: #10b981; font-weight: 800; font-size: 1.1rem;">✅ Full Withdrawal Access Unlocked</p>
              </div>
              <p>You can now withdraw funds from your campaigns directly to your bank account anytime.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://backr.app/dashboard" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 4b. KYC Rejected
    if (type === 'kyc_rejected') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC rejection');
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: '❌ Identity Verification Update',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #fef2f2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">❌</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Verification Failed</h2>
              <p>We were unable to verify your identity with the provided documents.</p>
              <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-weight: 700; color: #991b1b; font-size: 0.9rem; text-transform: uppercase;">Feedback:</p>
                <p style="margin: 8px 0 0; color: #0f172a;">${rejectionReason || 'Please ensure your ID is clear and all information is visible.'}</p>
              </div>
              <p>To withdraw funds, you must re-submit your verification documents in your profile settings.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="https://backr.app/dashboard/profile" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Re-upload ID
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 5. Creator Alert
    if (type === 'creator_alert') {
      const to = backerEmail;
      if (!to) throw new Error('Missing creator email');
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const [response] = await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: `You Just Got Backrd for "${campaignTitle}" 🎉`,
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <p>Hi ${creatorName || 'Creator'},</p>
              <p>You just received a new contribution for your campaign:</p>
              <p><strong>"${campaignTitle}"</strong></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
              <p><strong>From:</strong> ${backerName || 'A Supporter'}</p>
              <p><strong>Date:</strong> ${dateStr}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p>Your campaign is now at <strong>₦${Number(totalRaised).toLocaleString()} raised</strong>.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="${campaignUrl || 'https://backr.app/dashboard'}" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  View Campaign
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return { sent: true, type, messageId: response.headers['x-message-id'] };
    }

    // 6. Donor Receipt
    const to = backerEmail;
    if (!to) throw new Error('Missing backerEmail');
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const [response] = await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `Thanks for supporting "${campaignTitle}"! ✨`,
      html: `
        <div style="${emailWrapperStyle}">
          <div style="${emailCardStyle}">
            <p>Hi ${backerName || 'A Supporter'},</p>
            <p>Thank you for supporting <strong>"${campaignTitle}"</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <div style="margin-top: 40px; text-align: center;">
              <a href="${campaignUrl || 'https://backr.app/dashboard'}" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                Follow Progress
              </a>
            </div>
          </div>
        </div>
      `,
    });
    return { sent: true, type, messageId: response.headers['x-message-id'] };

  } catch (err: any) {
    console.error(`[Email Utility] Failed to send ${type}:`, err);
    return { sent: false, error: err.message };
  }
}

export function registerEmailReceiptWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);
  queue.process(async (job: { data: ReceiptJobData }) => {
    return await sendEmail(job.data);
  });
}

// ---------------------------------------------------------------------------
// 22.2 — email:backer-update worker
// Notifies all confirmed backers when a campaign update is published.
// ---------------------------------------------------------------------------

interface BackerUpdateJobData {
  campaignId: string;
  updateTitle: string;
  campaignTitle: string;
}

export function registerBackerUpdateWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_BACKER_UPDATE);

  queue.process(async (job: { data: BackerUpdateJobData }) => {
    const { campaignId, updateTitle, campaignTitle } = job.data;

    // Fetch distinct confirmed backer emails for this campaign
    const backerRows = await db
      .selectDistinct({ backerEmail: contributions.backerEmail })
      .from(contributions)
      .where(and(eq(contributions.campaignId, campaignId), eq(contributions.status, 'confirmed')));

    if (backerRows.length === 0) return { sent: 0 };

    const messages = backerRows.map((row: { backerEmail: string }) => ({
      to: row.backerEmail,
      from: FROM_EMAIL,
      subject: `New update on ${campaignTitle}: ${updateTitle}`,
      html: `
        <div style="${emailWrapperStyle}">
          <div style="${emailCardStyle}">
            <p>There's a new update on <strong>${campaignTitle}</strong>:</p>
            <h3 style="color: #0f172a; font-size: 1.25rem;">${updateTitle}</h3>
            <p>Log in to Backr to read the full update and see how your support is making an impact.</p>
            <div style="margin-top: 32px; text-align: center;">
              <a href="https://backr.app/dashboard" style="display:inline-block; padding:12px 24px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                Read Full Update
              </a>
            </div>
          </div>
        </div>
      `,
    }));

    // Send in batches to respect SendGrid rate limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      await sgMail.send(messages.slice(i, i + BATCH_SIZE) as any);
    }

    return { sent: backerRows.length };
  });
}

// ---------------------------------------------------------------------------
// 22.3 — email:account-lockout worker
// Notifies a user that their account has been temporarily locked.
// ---------------------------------------------------------------------------

interface AccountLockoutJobData {
  email: string;
  lockedUntil: string; // ISO date string
}

export function registerAccountLockoutWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_ACCOUNT_LOCKOUT);

  queue.process(async (job: { data: AccountLockoutJobData }) => {
    const { email, lockedUntil } = job.data;

    const lockedUntilDate = new Date(lockedUntil).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Your Backr account has been temporarily locked',
      html: `
        <p>Your Backr account has been <strong>temporarily locked</strong> due to multiple failed login attempts.</p>
        <p>Your account will be unlocked at: <strong>${lockedUntilDate}</strong></p>
      `,
    });

    return { sent: true, email };
  });
}

// ---------------------------------------------------------------------------
// 22.4 — email:subscription-renewal worker
// Notifies a user that their premium subscription payment failed.
// ---------------------------------------------------------------------------

interface SubscriptionRenewalJobData {
  email: string;
  plan: string;
  gracePeriodEndsAt: string; // ISO date string
}

export function registerSubscriptionRenewalWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_SUBSCRIPTION_RENEWAL);

  queue.process(async (job: { data: SubscriptionRenewalJobData }) => {
    const { email, plan, gracePeriodEndsAt } = job.data;

    const graceDate = new Date(gracePeriodEndsAt).toLocaleString('en-US', {
      dateStyle: 'long',
    });

    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Your Backr Premium subscription payment failed',
      html: `
        <p>Your Backr Premium (<strong>${plan}</strong>) subscription payment has failed.</p>
        <p>Grace period ends on: <strong>${graceDate}</strong></p>
      `,
    });

    return { sent: true, email, plan };
  });
}

// ---------------------------------------------------------------------------
// Register all email workers
// ---------------------------------------------------------------------------

export function registerEmailWorkers(): void {
  registerEmailReceiptWorker();
  registerBackerUpdateWorker();
  registerAccountLockoutWorker();
  registerSubscriptionRenewalWorker();
}
