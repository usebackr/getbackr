import sgMail from '@sendgrid/mail';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contributions } from '@/db/schema/contributions';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';

// Initialise SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@backr.app';

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
const BRAND_COLOR = '#ff7a00';
const BG_COLOR = '#f8fafc';
const CARD_BG = '#ffffff';

const emailWrapperStyle = `
  background-color: ${BG_COLOR}; 
  padding: 40px 20px; 
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
  line-height: 1.5;
`;

const emailCardStyle = `
  max-width: 580px; 
  margin: 0 auto; 
  background-color: ${CARD_BG}; 
  border-radius: 16px; 
  padding: 40px; 
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
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
}

export function registerEmailReceiptWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);

  queue.process(async (job: { data: ReceiptJobData }) => {
    const data = job.data;
    const { type, amount, currency, campaignTitle, backerEmail, email, otp } = data;

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

      await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: `🎉 New Donation Received: ${currency} ${Number(amount).toLocaleString()}`,
        html: `
          <div style="${emailWrapperStyle}">
            <div style="${emailCardStyle}">
              <div style="font-size: 3rem; margin-bottom: 24px;">💰</div>
              <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 16px;">Boom! You have new funding.</h2>
              <p>Someone just backed your project! Your campaign is moving forward.</p>
              <div style="background: #fdf2f2; border-left: 4px solid ${BRAND_COLOR}; padding: 24px; margin: 24px 0;">
                <p style="margin: 0; font-size: 0.9rem; color: #64748b;">Project Title</p>
                <h3 style="margin: 4px 0 16px 0; color: #0f172a;">${campaignTitle}</h3>
                <p style="margin: 0; font-size: 0.9rem; color: #64748b;">Amount Received</p>
                <h2 style="margin: 4px 0 0 0; color: ${BRAND_COLOR};">${currency} ${Number(amount).toLocaleString()}</h2>
              </div>
              <p style="font-size: 0.9rem;">Log in to your dashboard to see your updated balance and track your goals.</p>
              <a href="https://backr.app/dashboard" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-top: 24px;">Open Dashboard</a>
            </div>
          </div>
        `,
      });
      return { sent: true, type };
    }

    // C. Donor Receipt (Default)
    const to = backerEmail;
    if (!to) throw new Error('Missing backerEmail for receipt');

    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `Thanks for backing "${campaignTitle}"! ✨`,
      html: `
        <div style="${emailWrapperStyle}">
          <div style="${emailCardStyle}">
            <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 24px;">Your receipt is here.</h2>
            <p>Thank you for supporting <strong>${campaignTitle}</strong>. Your contribution has been processed successfully.</p>
            <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding-bottom: 12px; color: #64748b; font-size: 0.9rem;">Campaign</td>
                  <td style="padding-bottom: 12px; text-align: right; font-weight: 700;">${campaignTitle}</td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 12px; color: #64748b; font-size: 0.9rem;">Amount Backed</td>
                  <td style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: right; font-weight: 700; color: ${BRAND_COLOR}; font-size: 1.1rem;">${currency} ${Number(amount).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 0.9rem; color: #64748b; line-height: 1.6;">Your support directly helps the creator bring their vision to life. Thank you for being a part of this creative journey.</p>
            <div style="margin-top: 40px; text-align: center; font-size: 0.85rem; color: #94a3b8;">
              &copy; 2026 Backr.app — The Future of Creative Funding
            </div>
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
