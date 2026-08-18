import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { VehicleCustomField } from "@/lib/validation/vehicle-custom-fields";

import { timestamps } from "./common";
import { fuelTypeEnum, transmissionTypeEnum, vehicleStatusEnum } from "./enums";
import { locations } from "./locations";

export const vehicleClasses = pgTable(
  "vehicle_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    seats: integer("seats").notNull(),
    luggage: integer("luggage").notNull(),
    transmission: transmissionTypeEnum("transmission").notNull(),
    defaultDailyRate: integer("default_daily_rate").notNull(),
    defaultSecurityDeposit: integer("default_security_deposit").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_classes_slug_uidx").on(table.slug),
    uniqueIndex("vehicle_classes_name_uidx").on(table.name),
    index("vehicle_classes_active_idx").on(table.active),
    check(
      "vehicle_classes_name_not_blank",
      sql`char_length(btrim(${table.name})) > 0`,
    ),
    check(
      "vehicle_classes_slug_not_blank",
      sql`char_length(btrim(${table.slug})) > 0`,
    ),
    check("vehicle_classes_seats_positive", sql`${table.seats} > 0`),
    check("vehicle_classes_luggage_nonnegative", sql`${table.luggage} >= 0`),
    check(
      "vehicle_classes_default_daily_rate_nonnegative",
      sql`${table.defaultDailyRate} >= 0`,
    ),
    check(
      "vehicle_classes_default_security_deposit_nonnegative",
      sql`${table.defaultSecurityDeposit} >= 0`,
    ),
  ],
).enableRLS();

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id, { onDelete: "restrict" }),
    make: text("make").notNull(),
    model: text("model").notNull(),
    slug: text("slug").notNull(),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    description: text("description").notNull(),
    seats: integer("seats").notNull(),
    doors: integer("doors").notNull(),
    transmission: transmissionTypeEnum("transmission").notNull(),
    fuelType: fuelTypeEnum("fuel_type").notNull(),
    luggage: integer("luggage").notNull(),
    airConditioning: boolean("air_conditioning").default(true).notNull(),
    featured: boolean("featured").default(false).notNull(),
    published: boolean("published").default(false).notNull(),

    // Import provenance. The local row stays authoritative: nothing refreshes
    // these values from the provider automatically.
    externalProvider: text("external_provider"),
    externalVehicleId: text("external_vehicle_id"),
    externalImportedAt: timestamp("external_imported_at", {
      withTimezone: true,
      mode: "date",
    }),
    customFields: jsonb("custom_fields")
      .$type<VehicleCustomField[]>()
      .default([])
      .notNull(),

    // Imported specifications. Units are fixed by the column name.
    generation: text("generation"),
    trimLevel: text("trim_level"),
    bodyType: text("body_type"),
    engineName: text("engine_name"),
    engineDisplacementL: doublePrecision("engine_displacement_l"),
    cylinders: integer("cylinders"),
    powerKw: doublePrecision("power_kw"),
    torqueNm: integer("torque_nm"),
    driveType: text("drive_type"),
    lengthMm: integer("length_mm"),
    widthMm: integer("width_mm"),
    heightMm: integer("height_mm"),
    wheelbaseMm: integer("wheelbase_mm"),
    fuelEconomyLPer100Km: doublePrecision("fuel_economy_l_100km"),
    batteryCapacityKwh: doublePrecision("battery_capacity_kwh"),
    usableBatteryKwh: doublePrecision("usable_battery_kwh"),
    evRangeKm: integer("ev_range_km"),
    acChargingKw: doublePrecision("ac_charging_kw"),
    dcChargingKw: doublePrecision("dc_charging_kw"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_models_slug_uidx").on(table.slug),
    index("vehicle_models_class_idx").on(table.vehicleClassId),
    index("vehicle_models_published_idx").on(table.published),
    index("vehicle_models_featured_idx").on(table.featured),
    index("vehicle_models_external_idx").on(
      table.externalProvider,
      table.externalVehicleId,
    ),
    check("vehicle_models_make_not_blank", sql`char_length(btrim(${table.make})) > 0`),
    check(
      "vehicle_models_model_not_blank",
      sql`char_length(btrim(${table.model})) > 0`,
    ),
    check("vehicle_models_slug_not_blank", sql`char_length(btrim(${table.slug})) > 0`),
    check("vehicle_models_seats_positive", sql`${table.seats} > 0`),
    check("vehicle_models_doors_positive", sql`${table.doors} > 0`),
    check("vehicle_models_luggage_nonnegative", sql`${table.luggage} >= 0`),
    check(
      "vehicle_models_year_range",
      sql`${table.yearFrom} IS NULL OR ${table.yearTo} IS NULL OR ${table.yearTo} >= ${table.yearFrom}`,
    ),
    check(
      "vehicle_models_custom_fields_is_array",
      sql`jsonb_typeof(${table.customFields}) = 'array'`,
    ),
    check(
      "vehicle_models_external_reference_complete",
      sql`(${table.externalProvider} IS NULL AND ${table.externalVehicleId} IS NULL) OR (${table.externalProvider} IS NOT NULL AND ${table.externalVehicleId} IS NOT NULL)`,
    ),
  ],
).enableRLS();

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleModelId: uuid("vehicle_model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "restrict" }),
    vehicleClassId: uuid("vehicle_class_id")
      .notNull()
      .references(() => vehicleClasses.id, { onDelete: "restrict" }),
    internalCode: text("internal_code").notNull(),
    registrationNumber: text("registration_number").notNull(),
    colour: text("colour").notNull(),
    currentMileage: integer("current_mileage").default(0).notNull(),
    status: vehicleStatusEnum("status").default("inactive").notNull(),
    branchLocationId: uuid("branch_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicles_internal_code_uidx").on(table.internalCode),
    uniqueIndex("vehicles_registration_number_uidx").on(table.registrationNumber),
    index("vehicles_status_idx").on(table.status),
    index("vehicles_model_idx").on(table.vehicleModelId),
    index("vehicles_class_idx").on(table.vehicleClassId),
    index("vehicles_branch_idx").on(table.branchLocationId),
    check(
      "vehicles_internal_code_not_blank",
      sql`char_length(btrim(${table.internalCode})) > 0`,
    ),
    check(
      "vehicles_registration_number_not_blank",
      sql`char_length(btrim(${table.registrationNumber})) > 0`,
    ),
    check(
      "vehicles_colour_not_blank",
      sql`char_length(btrim(${table.colour})) > 0`,
    ),
    check("vehicles_mileage_nonnegative", sql`${table.currentMileage} >= 0`),
  ],
).enableRLS();

export const vehicleImages = pgTable(
  "vehicle_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleModelId: uuid("vehicle_model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    // Null for Nii Plants uploads. Set when the object was copied from an
    // external catalogue; public pages always serve the stored copy.
    sourceProvider: text("source_provider"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicle_images_model_idx").on(table.vehicleModelId),
    index("vehicle_images_sort_idx").on(table.vehicleModelId, table.sortOrder),
    check(
      "vehicle_images_storage_path_not_blank",
      sql`char_length(btrim(${table.storagePath})) > 0`,
    ),
    check(
      "vehicle_images_alt_text_not_blank",
      sql`char_length(btrim(${table.altText})) > 0`,
    ),
    check("vehicle_images_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check(
      "vehicle_images_source_reference_complete",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceProvider} IS NOT NULL`,
    ),
  ],
).enableRLS();
