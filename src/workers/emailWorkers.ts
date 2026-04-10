import { Resend } from 'resend';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { users } from '@/db/schema/users';
import { campaigns, Campaign } from '@/db/schema/campaigns';
import { CATEGORY_LABELS } from '@/lib/constants/categories';
// import { getQueue, QUEUE_NAMES } from '@/lib/queue'; // Removed during Redis decommissioning

// Initialise Resend with API key - Lazy loading to prevent build-time crashes
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Backr Platform <no-reply@findbackr.com.ng>';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    if (!RESEND_API_KEY) {
      console.warn('[Email Workers] RESEND_API_KEY is missing. Emails will fail to send.');
    }
    _resend = new Resend(RESEND_API_KEY);
  }
  return _resend;
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

const renderFooter = (includeUnsubscribe = true) => `
  <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
    &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos
    ${includeUnsubscribe ? `<br/><br/>You're receiving this email because of your engagement with Backr. <a href="https://findbackr.com.ng/" style="color: #64748b; text-decoration: underline;">Manage preferences</a>.` : ''}
  </div>
`;

export interface ReceiptJobData {
  contributionId?: string;
  backerEmail?: string;
  amount?: string | number;
  currency?: string;
  campaignTitle?: string;
  type?:
    | 'donor_receipt'
    | 'creator_alert'
    | 'withdrawal_otp'
    | 'bank_change_otp'
    | 'password_change_otp'
    | 'payment_approved'
    | 'kyc_approved'
    | 'withdrawal_rejected'
    | 'kyc_rejected'
    | 'kyc_revoked'
    | 'welcome_email'
    | 'forgot_password'
    | 'verification_email'
    | 'kyc_received'
    | 'account_deleted'
    | 'admin_action_required';
  userId?: string;
  email?: string;
  displayName?: string;
  token?: string;
  from?: string;
  otp?: string;
  rejectionReason?: string;
  // Extra data for creator alert
  creatorName?: string;
  backerName?: string;
  totalRaised?: string | number;
  goalAmount?: string | number;
  campaignUrl?: string;
  // Extra data for admin alert
  adminActionType?: 'kyc_request' | 'withdrawal_request';
  adminActionDetails?: string;
}

/**
 * Direct Send Utility — Use this for instant delivery in Serverless (Vercel)
 */
export async function sendEmail(data: ReceiptJobData) {
  const {
    type,
    amount,
    campaignTitle,
    backerEmail,
    email,
    otp,
    backerName,
    totalRaised,
    rejectionReason,
    displayName,
    token,
    from,
    adminActionType,
    adminActionDetails,
  } = data;

  console.log(
    `[Email Utility] Preparing to send ${type} to ${email || backerEmail || 'unknown recipient'}`,
  );

  if (!RESEND_API_KEY) {
    console.error('[Email Utility] RESEND_API_KEY is missing.');
    return { sent: false, error: 'Missing API key' };
  }

  try {
    // 1. Withdrawal OTP
    if (type === 'withdrawal_otp') {
      const to = email;
      if (!to) throw new Error('Missing email for withdrawal OTP');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Backr Withdrawal security code',
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
                &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos<br/><br/>You're receiving this email because of your engagement with Backr. <a href="https://findbackr.com.ng/" style="color: #64748b; text-decoration: underline;">Manage preferences</a>.
              </div>
            </div>
          </div>
        `,
        text: `Confirm Your Withdrawal\n\nYour one-time security code for campaign ${campaignTitle ?? 'your campaign'} is: ${otp}\n\nThis code expires in 10 minutes.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 1b. Bank Change OTP
    if (type === 'bank_change_otp') {
      const to = email;
      if (!to) throw new Error('Missing email for bank change OTP');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Backr security code for updating payout details',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #fef2f2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">🏦</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Confirm Bank Details Change</h2>
              <p>You requested to update the bank account linked to your platform payouts. Please use the verification code below to authorize this change:</p>
              <div style="background: #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin: 32px 0;">
                <h1 style="letter-spacing: 12px; font-size: 2.5rem; margin: 0; color: ${BRAND_COLOR};">${otp}</h1>
              </div>
              <p style="font-size: 0.9rem; color: #64748b; text-align: center;">This code expires in 10 minutes. If you did not make this request, please contact support immediately and change your password.</p>
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos<br/><br/>You're receiving this email because of your engagement with Backr. <a href="https://findbackr.com.ng/" style="color: #64748b; text-decoration: underline;">Manage preferences</a>.
              </div>
            </div>
          </div>
        `,
        text: `Confirm Bank Details Change\n\nYou requested to update your platform payouts bank account. Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 1c. Password Change OTP
    if (type === 'password_change_otp') {
      const to = email;
      if (!to) throw new Error('Missing email for password change OTP');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Backr security code for password reset',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #fef2f2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Confirm Password Change</h2>
              <p>You requested to change your Backr account password. Please use the verification code below to authorize this change:</p>
              <div style="background: #f1f5f9; padding: 24px; text-align: center; border-radius: 12px; margin: 32px 0;">
                <h1 style="letter-spacing: 12px; font-size: 2.5rem; margin: 0; color: ${BRAND_COLOR};">${otp}</h1>
              </div>
              <p style="font-size: 0.9rem; color: #64748b; text-align: center;">This code expires in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos<br/><br/>You're receiving this email because of your engagement with Backr. <a href="https://findbackr.com.ng/" style="color: #64748b; text-decoration: underline;">Manage preferences</a>.
              </div>
            </div>
          </div>
        `,
        text: `Confirm Password Change\n\nYou requested to change your Backr account password. Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 2. Withdrawal Approved (Payment Approved)
    if (type === 'payment_approved') {
      const to = email || backerEmail;
      if (!to) throw new Error('Missing email for approval notification');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Payout Approved: Your funds have been sent',
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard/wallet" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  View Transaction History
                </a>
              </div>
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos
              </div>
            </div>
          </div>
        `,
        text: `Payout Approved\n\nGreat news! Your withdrawal request for ₦${Number(amount).toLocaleString()} has been approved and the transfer has been initiated.\n\nCampaign: ${campaignTitle || 'Your Campaign'}\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 3. Withdrawal Rejected
    if (type === 'withdrawal_rejected') {
      const to = email || backerEmail;
      if (!to) throw new Error('Missing email for rejection notification');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Update on your withdrawal request',
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard/wallet" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  Return to Wallet
                </a>
              </div>
            </div>
          </div>
        `,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4. KYC Approved
    if (type === 'kyc_approved') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC approval');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Identity has been Verified',
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4b. KYC Rejected
    if (type === 'kyc_rejected') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC rejection');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Identity Verification Update',
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard/settings" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Re-upload ID
                </a>
              </div>
            </div>
          </div>
        `,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4b-2. KYC Revoked (Account was verified, now unverified)
    if (type === 'kyc_revoked') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC revocation');
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Important: Your Identity Verification Status has been Updated',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #fef2f2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">🛑</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Identity Verification Revoked</h2>
              <p>Hello ${displayName || 'there'},</p>
              <p>We are writing to inform you that your "Verified" status on Backr has been revoked following a routine security review or a detected discrepancy in your documents.</p>
              <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-weight: 700; color: #991b1b; font-size: 0.9rem; text-transform: uppercase;">Reason for Revocation:</p>
                <p style="margin: 8px 0 0; color: #0f172a;">${rejectionReason || 'A discrepancy was noted in your verification details. Please contact support for more information.'}</p>
              </div>
              <p><strong>Note:</strong> Your withdrawal privileges have been temporarily suspended. To restore full access to your funds, you must re-submit valid identity documents in your profile settings.</p>
              <div style="margin-top: 40px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard/settings" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Fix Verification Now
                </a>
              </div>
              ${renderFooter()}
            </div>
          </div>
        `,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4c. Welcome Email
    if (type === 'welcome_email') {
      const to = email;
      if (!to) throw new Error('Missing email for Welcome Email');
      const firstName = displayName ? displayName.split(' ')[0] : 'there';
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        : 'https://findbackr.com.ng/dashboard';
      const supportEmail = 'Usebackr@gmail.com';
      const founderName = 'Babatunde Lawal';

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Welcome to Backr',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <p>Hi ${firstName},</p>
              <p>I’m glad you’re here.</p>
              <p>Backr was built for a simple reason — creators need a better way to raise money, and supporters need a better way to trust where that money goes.</p>
              <p>Right now, a lot of creative projects depend on scattered links, direct transfers, and one-off requests. It works sometimes, but it’s not structured, and it’s hard to follow what actually happens after people contribute.</p>
              <p>Backr is our attempt to fix that.</p>
              <p>Here, you can raise funds, share updates, and show how money is being used — all in one place.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p><strong>If you’re a creator:</strong></p>
              <ul>
                <li>Start a campaign</li>
                <li>Share it with your audience</li>
                <li>Keep people updated as you build</li>
              </ul>
              <p><strong>If you’re here to support:</strong></p>
              <ul>
                <li>Explore projects</li>
                <li>Back what you believe in</li>
                <li>Follow the journey as it develops</li>
              </ul>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p>This is still early, and we’re building it with people like you in mind. If anything feels unclear or doesn’t work the way it should, we want to hear it.</p>
              <p>You can always reach us at <a href="mailto:${supportEmail}" style="color: ${BRAND_COLOR}; text-decoration: none;">${supportEmail}</a>.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <div style="text-align: center; margin: 32px 0;">
                <a href="${dashboardUrl}" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                  Go to your dashboard
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p>Thanks for being part of this.</p>
              <p style="margin: 0;">— ${founderName}</p>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Founder, Backr</p>
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 0.85rem; color: #94a3b8; text-align: center;">
                &copy; 2026 findbackr.com.ng &bull; Plot 17B, Doherty Estate, Lagos<br/><br/>You're receiving this email because of your engagement with Backr. <a href="https://findbackr.com.ng/" style="color: #64748b; text-decoration: underline;">Manage preferences</a>.
              </div>
            </div>
          </div>
        `,
        text: `Welcome to Backr!\n\nHi ${firstName},\n\nI’m glad you’re here. Backr was built for a simple reason — creators need a better way to raise money, and supporters need a better way to trust where that money goes.\n\nYou can raise funds, share updates, and show how money is being used — all in one place.\n\nExplore more at: https://findbackr.com.ng/dashboard\n\n— Babatunde Lawal\nFounder, Backr\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4d. Forgot Password
    if (type === 'forgot_password') {
      const to = email;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng';
      const resetUrl = `${appUrl}/reset-password?token=${token || data.token}&email=${email}${from ? `&from=${encodeURIComponent(from)}` : ''}`;
      if (!to) throw new Error('Missing email for Forgot Password');

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Reset your Backr password',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 24px;">Reset Your Password</h2>
              <p>Someone requested a password reset for your Backr account. If this was you, click the button below to set a new password:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Reset Password
                </a>
              </div>
              ${renderFooter()}
            </div>
          </div>
        `,
        text: `Reset your Backr password\n\nSomeone requested a password reset for your account. If this was you, use the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4e. Verification Email
    if (type === 'verification_email') {
      const to = email;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng';
      const verifyUrl = `${appUrl}/verify-email?token=${token || data.token}&email=${email}${from ? `&from=${encodeURIComponent(from)}` : ''}`;
      if (!to) throw new Error('Missing email for Verification');

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Verify your Backr account',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 24px;">Confirm Your Email</h2>
              <p>Thanks for joining Backr! Please verify your email address to complete your registration and start backing projects.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display:inline-block; padding:14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  Verify Email Address
                </a>
              </div>
              ${renderFooter()}
            </div>
          </div>
        `,
        text: `Verify your Backr account\n\nThanks for joining Backr! Please verify your email address to complete your registration:\n\n${verifyUrl}\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4f. KYC Received Confirmation
    if (type === 'kyc_received') {
      const to = email;
      if (!to) throw new Error('Missing email for KYC confirmation');

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Documents Received: Identity Verification in progress',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #f8fafc; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">📑</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Submission Received</h2>
              <p>We've successfully received your identity verification documents! Our team is now reviewing them.</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0; font-size: 0.9rem; color: #64748b; text-align: center;">
                  Review usually takes <strong>24-48 business hours</strong>. You'll receive another email as soon as your status is updated.
                </p>
              </div>
              ${renderFooter()}
            </div>
          </div>
        `,
        text: `Documents Received: Identity Verification in progress\n\nWe've successfully received your identity verification documents! Our team is now reviewing them. This usually takes 24-48 business hours.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4g. Account Deleted Confirmation
    if (type === 'account_deleted') {
      const to = email;
      if (!to) throw new Error('Missing email for Account Deletion');

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Backr account has been removed',
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="background: #f8fafc; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">⚠️</span>
              </div>
              <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">Account Removed</h2>
              <p>Hi ${displayName || 'there'},</p>
              <p>We're writing to inform you that your Backr account has been permanently removed by an administrator.</p>
              <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0; font-size: 0.9rem; color: #991b1b; text-align: center;">
                  All associated campaigns, financial records, and personal data have been <strong>permanently deleted</strong>.
                </p>
              </div>
              <p>If you have any questions regarding this action, please reach out to our support team.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              ${renderFooter()}
            </div>
          </div>
        `,
        text: `Account Removed\n\nHi ${displayName || 'there'},\n\nWe're writing to inform you that your Backr account has been permanently removed by an administrator. All associated campaigns and data have been deleted.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 4h. Admin Alerts
    if (type === 'admin_action_required') {
      const to = process.env.ADMIN_EMAIL || 'usebackr@gmail.com';
      const actionTitle = adminActionType === 'kyc_request' ? 'New KYC Verification Request' : 'New Withdrawal Request';
      
      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: `[ADMIN PRIORITY] ${actionTitle}`,
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}; border-top: 4px solid #ef4444;">
              <h2 style="font-size: 1.5rem; color: #ef4444; margin-bottom: 24px;">Action Required: ${actionTitle}</h2>
              <p>A user has submitted a request that requires administrative approval.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 1.1rem;">Details</h3>
                <p style="margin: 0; white-space: pre-wrap;">${adminActionDetails || 'Please check the admin dashboard for details.'}</p>
              </div>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard/admin" 
                   style="display: inline-block; padding: 12px 24px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Go to Admin Dashboard
                </a>
              </div>
              
              ${renderFooter(false)}
            </div>
          </div>
        `,
        text: `Admin Action Required: ${actionTitle}\n\nDetails: ${adminActionDetails || 'Check dashboard'}\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    if (type === 'creator_alert') {
      const to = email || backerEmail; // job variable stores the creator's email
      if (!to) throw new Error('Missing creator email');

      const { data: res, error } = await getResend().emails.send({
        to,
        from: FROM_EMAIL,
        subject: `You Just Got Backed! 🚀 ${campaignTitle}`,
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
               <div style="background: #ecfdf5; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 32px;">🔥</span>
              </div>
              <h2 style="font-size: 1.8rem; color: #0f172a; text-align: center; margin-bottom: 8px;">You Just Got Backed!</h2>
              <p style="text-align: center; color: #64748b; font-size: 1.1rem; margin-bottom: 32px;">Someone believes in your vision.</p>
              
              <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 0.85rem; text-transform: uppercase; font-weight: 700;">Contribution from:</p>
                <p style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">${backerName || 'A Supporter'}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
                <p style="margin: 0 0 4px; color: #64748b; font-size: 0.85rem;">Amount:</p>
                <p style="margin: 0; font-size: 1.5rem; font-weight: 900; color: #10b981;">₦${Number(amount).toLocaleString()}</p>
              </div>

              <p style="font-size: 0.95rem; line-height: 1.6; color: #334155;">Your campaign <strong>"${campaignTitle}"</strong> is gaining momentum. Your current total raised is <strong>₦${Number(totalRaised).toLocaleString()}</strong>.</p>

              ${renderFooter()}
            </div>
          </div>
        `,
      });
      if (error) throw error;
      return { sent: true, type, messageId: res?.id };
    }

    // 6. Donor Receipt
    const to = backerEmail;
    if (!to) throw new Error('Missing backerEmail');

    const { data: res, error } = await getResend().emails.send({
      to,
      from: FROM_EMAIL,
      subject: `Official Receipt: Thank you for backing ${campaignTitle}! 🌟`,
      html: `
        <div style="${emailWrapperStyle}">
          <div style="${emailCardStyle}">
            <div style="background: #f0fdf4; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <span style="font-size: 32px;">✨</span>
            </div>
            <h2 style="font-size: 1.8rem; color: #0f172a; text-align: center; margin-bottom: 8px;">You're making an impact!</h2>
            <p style="text-align: center; color: #64748b; font-size: 1.1rem; margin-bottom: 32px;">Thank you for backing ${campaignTitle}</p>
            
            <div style="border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Campaign</td>
                  <td style="text-align: right; font-weight: 700; padding-bottom: 8px;">${campaignTitle}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Amount</td>
                  <td style="text-align: right; font-weight: 700; color: #10b981; padding-bottom: 8px;">₦${Number(amount).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Status</td>
                  <td style="text-align: right; color: #10b981; font-weight: 700;">Confirmed ✅</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 0.95rem; line-height: 1.6; color: #334155;">You'll receive updates from the creator as they reach new milestones. Your support makes this possible.</p>

            ${renderFooter()}
          </div>
        </div>
      `,
    });
    if (error) throw error;
    return { sent: true, type, messageId: res?.id };
  } catch (err: any) {
    console.error(`[Email Utility] Failed to send ${type}:`, err);
    return { sent: false, error: err.message };
  }
}

// export function registerEmailReceiptWorker(): void {
//   const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);
//   queue.process(async (job: { data: ReceiptJobData }) => {
//     return await sendEmail(job.data);
//   });
// }

// ---------------------------------------------------------------------------
// 22.2 — email:backer-update worker
// Notifies all confirmed backers when a campaign update is published.
// ---------------------------------------------------------------------------

interface BackerUpdateJobData {
  campaignId: string;
  updateTitle: string;
  campaignTitle: string;
}

export async function sendBackerUpdateEmails(data: BackerUpdateJobData): Promise<{ sent: number }> {
  const { campaignId, updateTitle, campaignTitle } = data;

  // Fetch distinct confirmed backer emails for this campaign
  const backerRows = await db
    .selectDistinct({ backerEmail: contributions.backerEmail })
    .from(contributions)
    .where(and(eq(contributions.campaignId, campaignId), eq(contributions.status, 'confirmed')));

  if (backerRows.length === 0) return { sent: 0 };

  const emails = backerRows.map((row: { backerEmail: string }) => ({
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng'}/dashboard" style="display:inline-block; padding:12px 24px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
              Read Full Update
            </a>
          </div>
        </div>
      </div>
    `,
  }));

  // Send in batches to respect Resend rate limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    await getResend().batch.send(emails.slice(i, i + BATCH_SIZE));
  }

  return { sent: backerRows.length };
}

// ---------------------------------------------------------------------------
// 22.3 — email:account-lockout worker
// Notifies a user that their account has been temporarily locked.
// ---------------------------------------------------------------------------

interface AccountLockoutJobData {
  email: string;
  lockedUntil: string; // ISO date string
}

export async function sendAccountLockoutEmail(
  data: AccountLockoutJobData,
): Promise<{ sent: boolean }> {
  const { email, lockedUntil } = data;
  const lockedUntilDate = new Date(lockedUntil).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  await getResend().emails.send({
    to: email,
    from: FROM_EMAIL,
    subject: 'Your Backr account has been temporarily locked',
    html: `
      <div style="${emailWrapperStyle}">
        <div style="${emailCardStyle}">
          <p>Your Backr account has been <strong>temporarily locked</strong> due to multiple failed login attempts.</p>
          <p>Your account will be unlocked at: <strong>${lockedUntilDate}</strong></p>
          ${renderFooter()}
        </div>
      </div>
    `,
  });

  return { sent: true };
}
// ---------------------------------------------------------------------------
// 22.4 — Subscription Failure notification
// ---------------------------------------------------------------------------

interface SubscriptionRenewalJobData {
  email: string;
  plan: string;
  gracePeriodEndsAt: string; // ISO date string
}

export async function sendSubscriptionFailureEmail(
  data: SubscriptionRenewalJobData,
): Promise<{ sent: boolean }> {
  const { email, plan, gracePeriodEndsAt } = data;
  const graceDate = new Date(gracePeriodEndsAt).toLocaleDateString();

  await getResend().emails.send({
    to: email,
    from: FROM_EMAIL,
    subject: 'Action Required: Your Backr Premium renewal failed',
    html: `
      <div style="${emailWrapperStyle}">
        <div style="${emailCardStyle}">
          <h2>Renewal Failed</h2>
          <p>We were unable to renew your ${plan} subscription. Your account has entered a 7-day grace period ending on ${graceDate}.</p>
          <p>Please update your payment method to avoid losing premium features.</p>
            ${renderFooter()}
        </div>
      </div>
    `,
    text: `Subscription Renewal Failed\n\nWe were unable to renew your ${plan} subscription. Your grace period ends on ${graceDate}. Please update your payment method.\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
  });

  return { sent: true };
}

// ---------------------------------------------------------------------------
// 22.5 — New Project Alert
// Notifies users who have registered interest in a category.
// ---------------------------------------------------------------------------

export async function sendNewProjectAlerts(campaign: Campaign) {
  const categoryId = campaign.category;
  if (!categoryId) return { sent: 0 };

  // Fetch users interested in this category
  // Since 'interests' is jsonb, we use the element-at operator or a containment check
  const interestedUsers = await db
    .select({ email: users.email, displayName: users.displayName })
    .from(users)
    .where(sql`${users.interests} @> ${JSON.stringify([categoryId])}::jsonb`);

  if (interestedUsers.length === 0) return { sent: 0 };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng';
  const campaignUrl = `${appUrl}/c/${campaign.slug}`;
  const categoryLabel = CATEGORY_LABELS[categoryId] || categoryId;

  const emails = interestedUsers.map((user) => ({
    to: user.email,
    from: FROM_EMAIL,
    subject: `New in ${categoryLabel}: ${campaign.title} 🚀`,
    html: `
      <div style="${emailWrapperStyle}">
        <div style="${emailCardStyle}">
          <div style="background: #eff6ff; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
            <span style="font-size: 32px;">🌟</span>
          </div>
          <h2 style="font-size: 1.5rem; color: #0f172a; text-align: center; margin-bottom: 24px;">New Project in ${categoryLabel}</h2>
          <p>Hi ${user.displayName.split(' ')[0]},</p>
          <p>A new project has just been launched in one of your favorite categories!</p>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 32px 0;">
            ${campaign.coverImageUrl ? `<img src="${campaign.coverImageUrl}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
            <div style="padding: 24px;">
              <h3 style="margin: 0 0 8px; color: #0f172a;">${campaign.title}</h3>
              <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${campaign.description?.substring(0, 150)}...</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${campaignUrl}" style="display: inline-block; padding: 14px 32px; background: ${BRAND_COLOR}; color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">
              View Project
            </a>
          </div>

          ${renderFooter()}
        </div>
      </div>
    `,
    text: `New in ${categoryLabel}: ${campaign.title}!\n\nHi ${user.displayName.split(' ')[0]},\n\nA new project you might love just launched on Backr: ${campaign.title}\n\nCheck it out here: ${campaignUrl}\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
  }));

  // Batch send
  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    await getResend().batch.send(emails.slice(i, i + BATCH_SIZE));
  }

  return { sent: interestedUsers.length };
}

// ---------------------------------------------------------------------------
// 22.6 — Weekly Digest
// ---------------------------------------------------------------------------

export interface WeeklyDigestData {
  trendingCreators: { displayName: string; username: string; campaignTitle: string; totalAmount: number }[];
  newCampaigns: Campaign[];
}

export async function sendWeeklyDigestEmail(data: WeeklyDigestData) {
  const allUsers = await db.select({ email: users.email, displayName: users.displayName }).from(users);
  if (allUsers.length === 0) return { sent: 0 };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://findbackr.com.ng';
  
  const trendingHtml = data.trendingCreators.map(c => `
    <div style="padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px;">
      <h4 style="margin: 0; color: #0f172a;">${c.displayName} (@${c.username})</h4>
      <p style="margin: 4px 0 0; color: #64748b; font-size: 0.85rem;">Raised ₦${Number(c.totalAmount).toLocaleString()} this week for "${c.campaignTitle}"</p>
    </div>
  `).join('');

  const newHtml = data.newCampaigns.slice(0, 3).map(c => `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0; color: ${BRAND_COLOR};">${c.title}</h4>
      <p style="margin: 4px 0 0; color: #64748b; font-size: 0.85rem;">${CATEGORY_LABELS[c.category || ''] || 'General'}</p>
    </div>
  `).join('');

  const emails = allUsers.map(user => ({
    to: user.email,
    from: FROM_EMAIL,
    subject: `Weekly Roundup: Trending Creators & New Projects 💡`,
    html: `
      <div style="${emailWrapperStyle}">
        <div style="${emailCardStyle}">
          <h2 style="font-size: 1.8rem; color: #0f172a; text-align: center; margin-bottom: 8px;">Weekly Digest</h2>
          <p style="text-align: center; color: #64748b; margin-bottom: 32px;">Here's what happened on Backr this week.</p>
          
          <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px;">🔥 Trending Creators</h3>
          ${trendingHtml || '<p style="color: #94a3b8;">No trending activity this week.</p>'}
          
          <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px;">✨ New Projects</h3>
          ${newHtml || '<p style="color: #94a3b8;">No new projects this week.</p>'}
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${appUrl}/explore" style="display: inline-block; padding: 14px 32px; background: #0f172a; color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">
              Explore All Projects
            </a>
          </div>

          ${renderFooter()}
        </div>
      </div>
    `,
    text: `Backr Weekly Digest\n\nTrending Creators this week:\n${data.trendingCreators.map(c => `- ${c.displayName} raised ₦${Number(c.totalAmount).toLocaleString()}`).join('\n')}\n\nNew Projects:\n${data.newCampaigns.map(c => `- ${c.title}`).join('\n')}\n\nExplore more at ${appUrl}/explore\n\n© 2026 Backr - Plot 17B, Doherty Estate, Lagos`,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    await getResend().batch.send(emails.slice(i, i + BATCH_SIZE));
  }

  return { sent: allUsers.length };
}

// ---------------------------------------------------------------------------
// 22.5 — Bulk Email Campaign Processor
// ---------------------------------------------------------------------------

import { emailCampaigns } from '@/db/schema/emailCampaigns';

export async function processEmailCampaign(emailCampaignId: string): Promise<{ sent: number }> {
  const campaign = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, emailCampaignId),
  });

  if (!campaign || campaign.status !== 'sending') return { sent: 0 };

  // Fetch recipients based on source
  const recipientEmails: string[] = [];

  if (campaign.recipientSource === 'backers' || campaign.recipientSource === 'both') {
    const backerRows = await db
      .selectDistinct({ email: contributions.backerEmail })
      .from(contributions)
      .where(eq(contributions.campaignId, campaign.campaignId || ''));
    recipientEmails.push(...backerRows.map((r) => r.email));
  }

  // Deduplicate
  const uniqueRecipients = [...new Set(recipientEmails)];
  if (uniqueRecipients.length === 0) {
    await db
      .update(emailCampaigns)
      .set({ status: 'sent', sentCount: 0 })
      .where(eq(emailCampaigns.id, emailCampaignId));
    return { sent: 0 };
  }

  const emails = uniqueRecipients.map((to) => ({
    to,
    from: FROM_EMAIL,
    subject: campaign.subject,
    html: campaign.bodyHtml,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    await getResend().batch.send(emails.slice(i, i + BATCH_SIZE));
  }

  await db
    .update(emailCampaigns)
    .set({
      status: 'sent',
      sentCount: uniqueRecipients.length,
      sentAt: new Date(),
    })
    .where(eq(emailCampaigns.id, emailCampaignId));

  return { sent: uniqueRecipients.length };
}
