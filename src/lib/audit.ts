import { db } from '@/lib/db';
import { auditLogs } from '@/db/schema/auditLogs';

export interface AuditEvent {
  eventType: string;
  actorId?: string | null;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  await db.insert(auditLogs).values({
    eventType: event.eventType,
    actorId: event.actorId ?? null,
    resourceType: event.resourceType ?? null,
    resourceId: event.resourceId ?? null,
    metadata: event.metadata ?? null,
  });
}
