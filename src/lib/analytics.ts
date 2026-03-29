import { db } from './db';
import { auditLogs, NewAuditLog } from '@/db/schema/auditLogs';

export type EventType = 
  | 'user_login' 
  | 'user_logout' 
  | 'beta_signup' 
  | 'campaign_created' 
  | 'donation_made'
  | 'kyc_submitted'
  | 'withdrawal_requested'
  | 'admin_action';

/**
 * Tracks a system event in the audit_logs table for analytics.
 */
export async function trackEvent(
  eventType: EventType,
  actorId?: string,
  metadata?: Record<string, any>,
  resource?: { type: string; id: string }
) {
  try {
    const log: NewAuditLog = {
      eventType,
      actorId: actorId || null,
      resourceType: resource?.type || null,
      resourceId: resource?.id || null,
      metadata: metadata || {},
    };

    await db.insert(auditLogs).values(log);
  } catch (error) {
    // We don't want analytics to crash the main request flow, but we should log it.
    console.error(`[Analytics] Failed to track event ${eventType}:`, error);
  }
}
