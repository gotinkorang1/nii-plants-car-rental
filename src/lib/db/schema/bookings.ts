import { sql } from "drizzle-orm";
import {
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
import { customers } from "./customers";
import { bookingHistoryActorTypeEnum, bookingStatusEnum } from "./enums";
import { locations } from "./locations";
import { quotes, vehicleAllocations } from "./availability";
import { vehicleClasses, vehicleModels, vehicles } from "./fleet";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").notNull(),
    status: bookingStatusEnum("status").notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "restrict" }),
    vehicleModelId: uuid("vehicle_model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "restrict" }),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id, { onDelete: "restrict" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
      onDelete: "restrict",
    }),
    vehicleAllocationId: uuid("vehicle_allocation_id").references(
      () => vehicleAllocations.id,
      { onDelete: "restrict" },
    ),
    pickupLocationId: uuid("pickup_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    returnLocationId: uuid("return_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    pickupAt: timestamp("pickup_at", { withTimezone: true, mode: "date" }).notNull(),
    returnAt: timestamp("return_at", { withTimezone: true, mode: "date" }).notNull(),
    rentalTotal: integer("rental_total").notNull(),
    reservationPaymentRequired: integer("reservation_payment_required").notNull(),
    remainingBalance: integer("remaining_balance").notNull(),
    securityDepositRequired: integer("security_deposit_required").notNull(),
    amountPaid: integer("amount_paid").default(0).notNull(),
    driverAge: integer("driver_age").notNull(),
    licenceCountry: text("licence_country").notNull(),
    licenceNumber: text("licence_number"),
    customerNotes: text("customer_notes"),
    internalNotes: text("internal_notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "date" }),
    readyAt: timestamp("ready_at", { withTimezone: true, mode: "date" }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
    expiredAt: timestamp("expired_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("bookings_reference_uidx").on(table.reference),
    uniqueIndex("bookings_quote_id_uidx").on(table.quoteId),
    index("bookings_customer_idx").on(table.customerId),
    index("bookings_status_idx").on(table.status),
    index("bookings_pickup_at_idx").on(table.pickupAt),
    index("bookings_allocation_idx").on(table.vehicleAllocationId),
    check("bookings_rental_total_nonnegative", sql`${table.rentalTotal} >= 0`),
    check(
      "bookings_reservation_payment_nonnegative",
      sql`${table.reservationPaymentRequired} >= 0`,
    ),
    check(
      "bookings_remaining_balance_nonnegative",
      sql`${table.remainingBalance} >= 0`,
    ),
    check(
      "bookings_security_deposit_nonnegative",
      sql`${table.securityDepositRequired} >= 0`,
    ),
    check("bookings_amount_paid_nonnegative", sql`${table.amountPaid} >= 0`),
    check("bookings_driver_age_range", sql`${table.driverAge} >= 25 AND ${table.driverAge} <= 99`),
    check(
      "bookings_licence_country_not_blank",
      sql`char_length(btrim(${table.licenceCountry})) > 0`,
    ),
    check("bookings_pickup_before_return", sql`${table.pickupAt} < ${table.returnAt}`),
    check(
      "bookings_reference_not_blank",
      sql`char_length(btrim(${table.reference})) > 0`,
    ),
  ],
).enableRLS();

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    actorType: bookingHistoryActorTypeEnum("actor_type").notNull(),
    actorId: uuid("actor_id"),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_status_history_booking_idx").on(table.bookingId),
    index("booking_status_history_created_at_idx").on(table.createdAt),
  ],
).enableRLS();

export const bookingAccessCodes = pgTable(
  "booking_access_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    emailNormalized: text("email_normalized").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
    attemptCount: integer("attempt_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_access_codes_booking_idx").on(table.bookingId),
    index("booking_access_codes_expires_at_idx").on(table.expiresAt),
    check(
      "booking_access_codes_attempts_nonnegative",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
).enableRLS();

export const bookingGuestSessions = pgTable(
  "booking_guest_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("booking_guest_sessions_booking_idx").on(table.bookingId),
    index("booking_guest_sessions_expires_at_idx").on(table.expiresAt),
    uniqueIndex("booking_guest_sessions_token_hash_uidx").on(table.tokenHash),
  ],
).enableRLS();
