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

interface ReceiptJobData {
  contributionId?: string;
  backerEmail?: string;
  amount?: string | number;
  currency?: string;
  campaignTitle?: string;
  // Withdrawal OTP variant
  type?: 'withdrawal_otp';
  userId?: string;
  email?: string;
  otp?: string;
}

export function registerEmailReceiptWorker(): void {
  const queue = getQueue(QUEUE_NAMES.EMAIL_RECEIPT);

  queue.process(async (job: { data: ReceiptJobData }) => {
    const data = job.data;

    if (data.type === 'withdrawal_otp') {
      // Withdrawal OTP email
      const to = data.email;
      if (!to) throw new Error('Missing email for withdrawal OTP');

      await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject: 'Your Backr withdrawal OTP',
        text: [
          `Your one-time withdrawal code for campaign "${data.campaignTitle ?? 'your campaign'}" is:`,
          '',
          `  ${data.otp}`,
          '',
          'This code expires in 10 minutes. Do not share it with anyone.',
          '',
          '— The Backr Team',
        ].join('\n'),
        html: `
          <p>Your one-time withdrawal code for campaign <strong>${data.campaignTitle ?? 'your campaign'}</strong> is:</p>
          <h2 style="letter-spacing:4px;">${data.otp}</h2>
          <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p>— The Backr Team</p>
        `,
      });

      return { sent: true, type: 'withdrawal_otp' };
    }

    // Contribution receipt email
    const to = data.backerEmail;
    if (!to) throw new Error('Missing backerEmail for receipt');

    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: `Your contribution to ${data.campaignTitle ?? 'a campaign'}`,
      text: [
        `Thank you for backing "${data.campaignTitle ?? 'this campaign'}"!`,
        '',
        `Amount: ${data.currency ?? ''} ${data.amount ?? ''}`,
        '',
        'Your support means the world to the creator.',
        '',
        '— The Backr Team',
      ].join('\n'),
      html: `
        <p>Thank you for backing <strong>${data.campaignTitle ?? 'this campaign'}</strong>!</p>
        <p>Amount: <strong>${data.currency ?? ''} ${data.amount ?? ''}</strong></p>
        <p>Your support means the world to the creator.</p>
        <p>— The Backr Team</p>
      `,
    });

    return { sent: true, type: 'receipt', contributionId: data.contributionId };
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
