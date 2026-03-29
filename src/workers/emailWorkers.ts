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

interface ReceiptJobData {
  contributionId?: string;
  backerEmail?: string;
  amount?: string | number;
  currency?: string;
  campaignTitle?: string;
  type?: 'donor_receipt' | 'creator_alert' | 'withdrawal_otp';
  userId?: string;
  email?: string;
  otp?: string;
  // Extra data for creator alert
  creatorName?: string;
  backerName?: string;
  totalRaised?: string | number;
  goalAmount?: string | number;
  campaignUrl?: string;
}

export function registerEmailReceiptWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);

  queue.process(async (job: { data: ReceiptJobData }) => {
    const data = job.data;
    const { 
      type, amount, currency, campaignTitle, backerEmail, email, otp,
      creatorName, backerName, totalRaised, goalAmount, campaignUrl 
    } = data;

    // A. Withdrawal OTP
    if (type === 'withdrawal_otp') {
      const to = email;
      if (!to) throw new Error('Missing email for withdrawal OTP');

      await sgMail.send({
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
      return { sent: true, type };
    }

    // B. Creator Alert (New Funding Received)
    if (type === 'creator_alert') {
      const to = backerEmail; // In this job type, backerEmail is the creator's address
      if (!to) throw new Error('Missing creator email for alert');

      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });

      await sgMail.send({
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
              <p>Your campaign is now at:</p>
              <p><strong>₦${Number(totalRaised).toLocaleString()} raised of ₦${Number(goalAmount).toLocaleString()}</strong></p>
              <p>Keep the momentum going — every update helps build trust and attract more support.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p><strong>What to do next:</strong></p>
              <ul>
                <li>Share an update with your supporters</li>
                <li>Log how funds are being used</li>
                <li>Share your campaign link again</li>
              </ul>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p>
                <a href="${campaignUrl || 'https://backr.app/dashboard'}" 
                   style="display:inline-block; padding:12px 24px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                  View your campaign
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p>You're building something people believe in. Keep going.</p>
              <p>— Backr Team</p>
            </div>
          </div>
        `,
      });
      return { sent: true, type };
    }

    // C. Donor Receipt (Default)
    const to = backerEmail;
    if (!to) throw new Error('Missing backerEmail for receipt');

    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `Thanks for supporting "${campaignTitle}"! ✨`,
      html: `
        <div style="${emailWrapperStyle}">
          <div style="${emailCardStyle}">
            <p>Hi ${backerName || 'A Supporter'},</p>
            <p>Thank you for supporting <strong>"${campaignTitle}"</strong>.</p>
            <p>Your contribution has been successfully received.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Reference:</strong> ${data.contributionId || 'N/A'}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>You’re now part of this project. You can follow its progress, updates, and how funds are used.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>
              <a href="${campaignUrl || 'https://backr.app/dashboard'}" 
                 style="display:inline-block; padding:12px 24px; background: ${BRAND_COLOR}; color: white; text-decoration:none; border-radius: 12px; font-weight: 700;">
                View campaign
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>Creators on Backr can share updates and log how funds are used so you can stay informed as the project develops.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>If you created an account, you’ll receive updates automatically. If not, you can revisit the campaign anytime using the link above.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p>Thanks again for your support.</p>
            <p>— Backr Team</p>
          </div>
        </div>
      `,
    });

    return { sent: true, type: 'donor_receipt', contributionId: data.contributionId };
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
      text: [
        `There's a new update on "${campaignTitle}":`,
        '',
        `"${updateTitle}"`,
        '',
        'Log in to Backr to read the full update.',
        '',
        '— The Backr Team',
      ].join('\n'),
      html: `
        <p>There's a new update on <strong>${campaignTitle}</strong>:</p>
        <h3>${updateTitle}</h3>
        <p>Log in to Backr to read the full update.</p>
        <p>— The Backr Team</p>
      `,
    }));

    // Send in batches to respect SendGrid rate limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      await sgMail.send(messages.slice(i, i + BATCH_SIZE) as Parameters<typeof sgMail.send>[0]);
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
      text: [
        'Your Backr account has been temporarily locked due to multiple failed login attempts.',
        '',
        `Your account will be unlocked at: ${lockedUntilDate}`,
        '',
        'If this was not you, please contact support immediately.',
        '',
        '— The Backr Team',
      ].join('\n'),
      html: `
        <p>Your Backr account has been <strong>temporarily locked</strong> due to multiple failed login attempts.</p>
        <p>Your account will be unlocked at: <strong>${lockedUntilDate}</strong></p>
        <p>If this was not you, please contact support immediately.</p>
        <p>— The Backr Team</p>
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
      text: [
        `Your Backr Premium (${plan}) subscription payment has failed.`,
        '',
        `You have a 7-day grace period. Premium access will be revoked on: ${graceDate}`,
        '',
        'Please update your payment method to avoid losing access to premium features.',
        '',
        '— The Backr Team',
      ].join('\n'),
      html: `
        <p>Your Backr Premium (<strong>${plan}</strong>) subscription payment has failed.</p>
        <p>You have a <strong>7-day grace period</strong>. Premium access will be revoked on: <strong>${graceDate}</strong></p>
        <p>Please update your payment method to avoid losing access to premium features.</p>
        <p>— The Backr Team</p>
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
