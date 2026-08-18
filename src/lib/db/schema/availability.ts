import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { allocationStatusEnum, allocationTypeEnum } from "./enums";
import { locations } from "./locations";
import { promotions } from "./pricing";
import { staffProfiles } from "./staff";
import { vehicleClasses, vehicleModels, vehicles } from "./fleet";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleModelId: uuid("vehicle_model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "restrict" }),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id, { onDelete: "restrict" }),
    pickupLocationId: uuid("pickup_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    returnLocationId: uuid("return_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    pickupAt: timestamp("pickup_at", { withTimezone: true, mode: "date" }).notNull(),
    returnAt: timestamp("return_at", { withTimezone: true, mode: "date" }).notNull(),
    chargeableDays: integer("chargeable_days").notNull(),
    dailyRate: integer("daily_rate").notNull(),
    baseRental: integer("base_rental").notNull(),
    extrasTotal: integer("extras_total").notNull(),
    discountTotal: integer("discount_total").notNull(),
    rentalTotal: integer("rental_total").notNull(),
    reservationPayment: integer("reservation_payment").notNull(),
    remainingBalance: integer("remaining_balance").notNull(),
    securityDepositRequired: integer("security_deposit_required").notNull(),
    promotionId: uuid("promotion_id").references(() => promotions.id, {
      onDelete: "restrict",
    }),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("quotes_model_idx").on(table.vehicleModelId),
    index("quotes_class_idx").on(table.vehicleClassId),
    index("quotes_expires_at_idx").on(table.expiresAt),
    index("quotes_pickup_at_idx").on(table.pickupAt),
    check("quotes_chargeable_days_positive", sql`${table.chargeableDays} > 0`),
    check("quotes_daily_rate_nonnegative", sql`${table.dailyRate} >= 0`),
    check("quotes_base_rental_nonnegative", sql`${table.baseRental} >= 0`),
    check("quotes_extras_total_nonnegative", sql`${table.extrasTotal} >= 0`),
    check("quotes_discount_total_nonnegative", sql`${table.discountTotal} >= 0`),
    check("quotes_rental_total_nonnegative", sql`${table.rentalTotal} >= 0`),
    check(
      "quotes_reservation_payment_nonnegative",
      sql`${table.reservationPayment} >= 0`,
    ),
    check(
      "quotes_remaining_balance_nonnegative",
      sql`${table.remainingBalance} >= 0`,
    ),
    check(
      "quotes_security_deposit_nonnegative",
      sql`${table.securityDepositRequired} >= 0`,
    ),
    check("quotes_pickup_before_return", sql`${table.pickupAt} < ${table.returnAt}`),
  ],
).enableRLS();

export const vehicleAllocations = pgTable(
  "vehicle_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    bookingId: uuid("booking_id"),
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "restrict" }),
    allocationType: allocationTypeEnum("allocation_type").notNull(),
    status: allocationStatusEnum("status").notNull(),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    reason: text("reason"),
    createdBy: uuid("created_by").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("vehicle_allocations_vehicle_idx").on(table.vehicleId),
    index("vehicle_allocations_quote_idx").on(table.quoteId),
    index("vehicle_allocations_status_idx").on(table.status),
    index("vehicle_allocations_type_idx").on(table.allocationType),
    index("vehicle_allocations_range_idx").on(table.startAt, table.endAt),
    check(
      "vehicle_allocations_start_before_end",
      sql`${table.startAt} < ${table.endAt}`,
    ),
  ],
).enableRLS();
