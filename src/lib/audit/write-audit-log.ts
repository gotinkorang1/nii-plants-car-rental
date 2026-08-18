import "server-only";

import { sanitizeAuditMetadata } from "@/lib/audit/sanitize";
import { tryGetDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { log } from "@/lib/logger";

export type AuditActorType = "staff" | "system" | "customer";

export type WriteAuditLogInput = {
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const db = tryGetDb();

  if (!db) {
    log("warn", "Audit log skipped because DATABASE_URL is not configured", {
      action: input.action,
      entityType: input.entityType,
    });
    return;
  }

  try {
    await db.insert(auditLogs).values({
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: sanitizeAuditMetadata(input.metadata),
    });
  } catch (error) {
    log("error", "Failed to write audit log", {
      action: input.action,
      entityType: input.entityType,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
