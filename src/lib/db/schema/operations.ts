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
import { bookings } from "./bookings";
import {
  fuelLevelEnum,
  inspectionConditionEnum,
  inspectionPhotoCategoryEnum,
  inspectionTypeEnum,
  maintenanceStatusEnum,
  maintenanceTypeEnum,
  securityDepositCollectionMethodEnum,
  securityDepositStatusEnum,
} from "./enums";
import { vehicles } from "./fleet";
import { vehicleAllocations } from "./availability";
import { staffProfiles } from "./staff";

export const rentalInspections = pgTable(
  "rental_inspections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    inspectionType: inspectionTypeEnum("inspection_type").notNull(),
    odometer: integer("odometer"),
    fuelLevel: fuelLevelEnum("fuel_level"),
    generalCondition: inspectionConditionEnum("general_condition"),
    damageSummary: text("damage_summary"),
    maintenanceRequired: boolean("maintenance_required").default(false).notNull(),
    staffNotes: text("staff_notes"),
    completedBy: uuid("completed_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("rental_inspections_booking_type_uidx").on(
      table.bookingId,
      table.inspectionType,
    ),
    index("rental_inspections_vehicle_idx").on(table.vehicleId),
    index("rental_inspections_completed_at_idx").on(table.completedAt),
    check(
      "rental_inspections_odometer_nonnegative",
      sql`${table.odometer} IS NULL OR ${table.odometer} >= 0`,
    ),
  ],
).enableRLS();

export const inspectionPhotos = pgTable(
  "inspection_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inspectionId: uuid("inspection_id")
      .notNull()
      .references(() => rentalInspections.id, { onDelete: "restrict" }),
    storagePath: text("storage_path").notNull(),
    category: inspectionPhotoCategoryEnum("category").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").default(0).notNull(),
    uploadedBy: uuid("uploaded_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inspection_photos_inspection_idx").on(table.inspectionId),
    check(
      "inspection_photos_storage_path_not_blank",
      sql`char_length(btrim(${table.storagePath})) > 0`,
    ),
    check(
      "inspection_photos_sort_order_nonnegative",
      sql`${table.sortOrder} >= 0`,
    ),
  ],
).enableRLS();

export const rentalPickupChecklists = pgTable(
  "rental_pickup_checklists",
  {
    bookingId: uuid("booking_id")
      .primaryKey()
      .references(() => bookings.id, { onDelete: "restrict" }),
    identityChecked: boolean("identity_checked").default(false).notNull(),
    licenceChecked: boolean("licence_checked").default(false).notNull(),
    vehicleConditionChecked: boolean("vehicle_condition_checked")
      .default(false)
      .notNull(),
    fuelChecked: boolean("fuel_checked").default(false).notNull(),
    odometerChecked: boolean("odometer_checked").default(false).notNull(),
    customerBriefed: boolean("customer_briefed").default(false).notNull(),
    securityDepositRecorded: boolean("security_deposit_recorded")
      .default(false)
      .notNull(),
    updatedBy: uuid("updated_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    ...timestamps,
  },
).enableRLS();

export const securityDeposits = pgTable(
  "security_deposits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    requiredAmount: integer("required_amount").notNull(),
    collectedAmount: integer("collected_amount").default(0).notNull(),
    collectionMethod: securityDepositCollectionMethodEnum("collection_method"),
    status: securityDepositStatusEnum("status").notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true, mode: "date" }),
    releasedAt: timestamp("released_at", { withTimezone: true, mode: "date" }),
    referenceNote: text("reference_note"),
    staffNotes: text("staff_notes"),
    retentionReason: text("retention_reason"),
    recordedBy: uuid("recorded_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("security_deposits_booking_uidx").on(table.bookingId),
    index("security_deposits_status_idx").on(table.status),
    check(
      "security_deposits_required_amount_nonnegative",
      sql`${table.requiredAmount} >= 0`,
    ),
    check(
      "security_deposits_collected_amount_nonnegative",
      sql`${table.collectedAmount} >= 0`,
    ),
  ],
).enableRLS();

export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    vehicleAllocationId: uuid("vehicle_allocation_id").references(
      () => vehicleAllocations.id,
      { onDelete: "restrict" },
    ),
    maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
    status: maintenanceStatusEnum("status").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
    odometerAtStart: integer("odometer_at_start"),
    cost: integer("cost"),
    providerName: text("provider_name"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    completedBy: uuid("completed_by").references(() => staffProfiles.id, {
      onDelete: "restrict",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("maintenance_records_vehicle_idx").on(table.vehicleId),
    index("maintenance_records_status_idx").on(table.status),
    index("maintenance_records_start_at_idx").on(table.startAt),
    index("maintenance_records_end_at_idx").on(table.endAt),
    check(
      "maintenance_records_title_not_blank",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      "maintenance_records_odometer_nonnegative",
      sql`${table.odometerAtStart} IS NULL OR ${table.odometerAtStart} >= 0`,
    ),
    check(
      "maintenance_records_cost_nonnegative",
      sql`${table.cost} IS NULL OR ${table.cost} >= 0`,
    ),
    check(
      "maintenance_records_start_before_end",
      sql`${table.startAt} < ${table.endAt}`,
    ),
  ],
).enableRLS();
