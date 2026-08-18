import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    authUserId: uuid("auth_user_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_email_uidx").on(table.email),
    index("customers_phone_idx").on(table.phone),
    index("customers_auth_user_id_idx").on(table.authUserId),
    check(
      "customers_first_name_not_blank",
      sql`char_length(btrim(${table.firstName})) > 0`,
    ),
    check(
      "customers_last_name_not_blank",
      sql`char_length(btrim(${table.lastName})) > 0`,
    ),
    check(
      "customers_email_not_blank",
      sql`char_length(btrim(${table.email})) > 0`,
    ),
    check(
      "customers_phone_not_blank",
      sql`char_length(btrim(${table.phone})) > 0`,
    ),
  ],
).enableRLS();
