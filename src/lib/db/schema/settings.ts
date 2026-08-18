import { sql } from "drizzle-orm";
import {
  check,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("site_settings_key_uidx").on(table.key),
    check("site_settings_key_not_blank", sql`char_length(btrim(${table.key})) > 0`),
  ],
).enableRLS();
