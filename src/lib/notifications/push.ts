import webPush from 'web-push';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema/notifications';
import { pushSubscriptions } from '@/db/schema/pushSubscriptions';
import { eq } from 'drizzle-orm';

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@findbackr.com.ng',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Web Push] VAPID keys are missing. Push notifications will not be sent.');
}

/**
 * Creates a notification in the database and pushes it to all registered user's devices.
 * 
 * @param userId - The user receiving the notification
 * @param title - The title of the alert
 * @param message - The body description
 * @param type - Determines the icon/action 
 * @param link - Optional URL to redirect to when clicked
 */
export async function sendAppNotification(
  userId: string,
  title: string,
  message: string,
  type: 'donation_received' | 'campaign_approved' | 'campaign_rejected' | 'payout_processed' | 'kyc_status_updated' | 'system_alert' = 'system_alert',
  link: string = '/dashboard/notifications',
  metadata?: string
) {
  try {
    // 1. Insert into the database (in-app view)
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      metadata,
    });

    // 2. Fetch user's push subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return;

    // 3. Send Web Push to all registered devices
    const payload = JSON.stringify({
      title,
      body: message,
      url: link,
      icon: type === 'donation_received' ? '💰' : '🎉', // Fallback handled by SW if empty
    });

    const sendPromises = subscriptions.map((sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      return webPush.sendNotification(pushConfig, payload).catch(async (err) => {
        // If subscription is gone/expired (410, 404), delete it from our DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[Web Push] Subscription expired, removing: ${sub.id}`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error(`[Web Push Error] Failed to send to ${sub.endpoint}:`, err);
        }
      });
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('[sendAppNotification Error]', err);
  }
}
