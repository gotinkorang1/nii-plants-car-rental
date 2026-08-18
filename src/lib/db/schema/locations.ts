import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { locationTypeEnum } from "./enums";

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: locationTypeEnum("type").notNull(),
    address: text("address"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("locations_slug_uidx").on(table.slug),
    index("locations_active_idx").on(table.active),
    index("locations_type_idx").on(table.type),
    check("locations_name_not_blank", sql`char_length(btrim(${table.name})) > 0`),
    check("locations_slug_not_blank", sql`char_length(btrim(${table.slug})) > 0`),
  ],
).enableRLS();
