import { index, integer, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { locations } from "./locations";
import { vehicleModels } from "./fleet";

export const vehicleInventorySlots = pgTable(
  "vehicle_inventory_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vehicleModelId: uuid("vehicle_model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    pickupLocationId: uuid("pickup_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    slotNumber: integer("slot_number").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("vehicle_inventory_slots_model_location_slot_uidx").on(
      table.vehicleModelId,
      table.pickupLocationId,
      table.slotNumber,
    ),
    index("vehicle_inventory_slots_model_location_idx").on(
      table.vehicleModelId,
      table.pickupLocationId,
    ),
  ],
).enableRLS();
