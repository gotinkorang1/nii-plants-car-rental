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
import { staffRoleEnum } from "./enums";

export const staffProfiles = pgTable(
  "staff_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    role: staffRoleEnum("role").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("staff_profiles_auth_user_id_uidx").on(table.authUserId),
    uniqueIndex("staff_profiles_email_uidx").on(table.email),
    index("staff_profiles_role_idx").on(table.role),
    index("staff_profiles_active_idx").on(table.active),
    check(
      "staff_profiles_display_name_not_blank",
      sql`char_length(btrim(${table.displayName})) > 0`,
    ),
    check(
      "staff_profiles_email_not_blank",
      sql`char_length(btrim(${table.email})) > 0`,
    ),
  ],
).enableRLS();
