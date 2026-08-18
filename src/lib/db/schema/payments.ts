import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { bookings } from "./bookings";
import { paymentPurposeEnum, paymentStatusEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    purpose: paymentPurposeEnum("purpose").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    provider: text("provider").notNull(),
    providerReference: text("provider_reference").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    status: paymentStatusEnum("status").notNull(),
    authorizationUrl: text("authorization_url"),
    accessCode: text("access_code"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
    providerSnapshot: jsonb("provider_snapshot").$type<Record<string, unknown>>(),
    failureReason: text("failure_reason"),
    reviewRequired: boolean("review_required").default(false).notNull(),
    reviewReason: text("review_reason"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_provider_reference_uidx").on(table.providerReference),
    index("payments_booking_idx").on(table.bookingId),
    index("payments_status_idx").on(table.status),
    index("payments_purpose_idx").on(table.purpose),
    index("payments_created_at_idx").on(table.createdAt),
    index("payments_paid_at_idx").on(table.paidAt),
    index("payments_review_required_idx").on(table.reviewRequired),
    uniqueIndex("payments_one_active_initial_uidx")
      .on(table.bookingId)
      .where(
        sql`${table.purpose} in ('reservation', 'full_rental') and ${table.status} in ('created', 'provider_pending', 'succeeded')`,
      ),
    uniqueIndex("payments_one_active_balance_uidx")
      .on(table.bookingId)
      .where(
        sql`${table.purpose} = 'balance' and ${table.status} in ('created', 'provider_pending')`,
      ),
    check("payments_amount_positive", sql`${table.amount} > 0`),
    check("payments_currency_ghs", sql`${table.currency} = 'GHS'`),
    check("payments_provider_paystack", sql`${table.provider} = 'paystack'`),
    check(
      "payments_provider_reference_not_blank",
      sql`char_length(btrim(${table.providerReference})) > 0`,
    ),
  ],
).enableRLS();
