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
import {
  auditActorTypeEnum,
  enquiryServiceTypeEnum,
  enquirySourceEnum,
  enquiryStatusEnum,
} from "./enums";
import { vehicleClasses } from "./fleet";
import { staffProfiles } from "./staff";

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").notNull(),
    serviceType: enquiryServiceTypeEnum("service_type").notNull(),
    status: enquiryStatusEnum("status").notNull().default("new"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    companyName: text("company_name"),
    pickupLocationText: text("pickup_location_text"),
    returnLocationText: text("return_location_text"),
    pickupAt: timestamp("pickup_at", { withTimezone: true, mode: "date" }),
    returnAt: timestamp("return_at", { withTimezone: true, mode: "date" }),
    passengerCount: integer("passenger_count"),
    vehicleClassId: uuid("vehicle_class_id").references(() => vehicleClasses.id, {
      onDelete: "set null",
    }),
    customerMessage: text("customer_message"),
    serviceDetails: jsonb("service_details").notNull().default({}),
    quotedAmount: integer("quoted_amount"),
    quoteNotes: text("quote_notes"),
    quoteValidUntil: timestamp("quote_valid_until", {
      withTimezone: true,
      mode: "date",
    }),
    assignedTo: uuid("assigned_to").references(() => staffProfiles.id, {
      onDelete: "set null",
    }),
    internalNotes: text("internal_notes"),
    source: enquirySourceEnum("source").notNull().default("website"),
    contactedAt: timestamp("contacted_at", { withTimezone: true, mode: "date" }),
    quotedAt: timestamp("quoted_at", { withTimezone: true, mode: "date" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("enquiries_reference_uidx").on(table.reference),
    index("enquiries_status_idx").on(table.status),
    index("enquiries_service_type_idx").on(table.serviceType),
    index("enquiries_created_at_idx").on(table.createdAt),
    index("enquiries_pickup_at_idx").on(table.pickupAt),
    index("enquiries_assigned_to_idx").on(table.assignedTo),
    index("enquiries_email_idx").on(table.email),
    check(
      "enquiries_passenger_count_positive",
      sql`${table.passengerCount} IS NULL OR ${table.passengerCount} > 0`,
    ),
    check(
      "enquiries_quoted_amount_nonnegative",
      sql`${table.quotedAmount} IS NULL OR ${table.quotedAmount} >= 0`,
    ),
    check(
      "enquiries_pickup_before_return",
      sql`${table.pickupAt} IS NULL OR ${table.returnAt} IS NULL OR ${table.pickupAt} < ${table.returnAt}`,
    ),
  ],
);

export const enquiryStatusHistory = pgTable(
  "enquiry_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "restrict" }),
    fromStatus: enquiryStatusEnum("from_status"),
    toStatus: enquiryStatusEnum("to_status").notNull(),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    actorId: uuid("actor_id"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("enquiry_status_history_enquiry_idx").on(table.enquiryId),
    index("enquiry_status_history_created_at_idx").on(table.createdAt),
  ],
);
