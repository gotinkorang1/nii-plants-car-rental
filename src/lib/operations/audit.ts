import "server-only";

import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function auditOperationsEvent(input: {
  staffId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}
