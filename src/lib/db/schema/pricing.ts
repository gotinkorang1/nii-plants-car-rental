import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { extraPricingTypeEnum, promotionTypeEnum } from "./enums";

export const extras = pgTable(
  "extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    pricingType: extraPricingTypeEnum("pricing_type").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("extras_name_uidx").on(table.name),
    index("extras_active_idx").on(table.active),
    check("extras_name_not_blank", sql`char_length(btrim(${table.name})) > 0`),
    check("extras_price_nonnegative", sql`${table.price} >= 0`),
  ],
).enableRLS();

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    type: promotionTypeEnum("type").notNull(),
    value: integer("value").notNull(),
    active: boolean("active").default(false).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
    maxUses: integer("max_uses"),
    usageCount: integer("usage_count").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotions_code_uidx").on(table.code),
    index("promotions_active_idx").on(table.active),
    index("promotions_schedule_idx").on(table.startsAt, table.endsAt),
    check("promotions_code_not_blank", sql`char_length(btrim(${table.code})) > 0`),
    check("promotions_value_nonnegative", sql`${table.value} >= 0`),
    check(
      "promotions_percentage_value_range",
      sql`${table.type} <> 'percentage' OR (${table.value} >= 0 AND ${table.value} <= 100)`,
    ),
    check("promotions_usage_count_nonnegative", sql`${table.usageCount} >= 0`),
    check(
      "promotions_max_uses_positive",
      sql`${table.maxUses} IS NULL OR ${table.maxUses} > 0`,
    ),
    check(
      "promotions_usage_within_max",
      sql`${table.maxUses} IS NULL OR ${table.usageCount} <= ${table.maxUses}`,
    ),
    check("promotions_date_range", sql`${table.endsAt} >= ${table.startsAt}`),
  ],
).enableRLS();
