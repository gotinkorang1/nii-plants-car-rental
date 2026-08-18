import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { auditActorTypeEnum } from "./enums";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_actor_idx").on(table.actorType, table.actorId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_action_idx").on(table.action),
    check("audit_logs_action_not_blank", sql`char_length(btrim(${table.action})) > 0`),
    check(
      "audit_logs_entity_type_not_blank",
      sql`char_length(btrim(${table.entityType})) > 0`,
    ),
  ],
).enableRLS();
