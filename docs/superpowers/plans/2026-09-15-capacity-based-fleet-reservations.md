# Capacity-Based Fleet Reservations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reserve one of 10 capacity slots per vehicle model and office pickup location, then assign a physical vehicle number before pickup.

**Architecture:** Add `vehicle_inventory_slots` as the model/location capacity ledger and make booking allocations reference a slot while allowing `vehicle_id` to remain null until staff assignment. PostgreSQL will atomically select an unoccupied slot for the exact model, pickup location, and date range; existing physical-vehicle allocations remain valid for maintenance and already-assigned bookings.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, PostgreSQL/Supabase, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-15-capacity-based-fleet-reservations-design.md`

## Global Constraints

- Capacity is exactly 10 slots per published model at each supported office pickup location.
- Supported office locations are Alisa Hotel - Ridge, Alisa Hotel - Tema, and Head office - Dansoman.
- Reservations must not fabricate registration numbers or physical vehicle rows.
- Public pages must not expose registration numbers.
- Existing physical-vehicle allocations and existing bookings must remain usable.
- A booking cannot be handed over without a physical vehicle assignment.
- Apply schema changes only to the linked Nii Plants Supabase project after verification; do not alter other projects.
- Never place database, Supabase, Resend, Paystack, or Vercel secrets in source files, commits, or chat.

## File Map

- Create `src/lib/db/schema/inventory.ts` for the capacity-slot table.
- Modify `src/lib/db/schema/availability.ts` to reference inventory slots and permit unassigned booking reservations.
- Modify `src/lib/availability/get-available-models.ts` for model/location capacity counts.
- Modify `src/lib/availability/create-hold.ts` and `src/lib/quotes/create-quote.ts` for slot-based holds.
- Create `src/lib/operations/assign-booking-vehicle.ts` for transactional staff assignment.
- Modify booking preparation and admin booking screens to require/perform assignment.
- Create `drizzle/0013_capacity_based_inventory.sql` and update Drizzle metadata through the project’s normal generation workflow.
- Add focused unit and SQL-source tests under `tests/unit` and `tests/integration`.

### Task 1: Lock down the capacity contract with failing tests

**Files:**
- Create: `tests/unit/fleet-capacity.test.ts`
- Create: `tests/integration/phase13-capacity-sql.test.ts`

**Interfaces:**
- The pure capacity helper will expose `INVENTORY_CAPACITY_PER_MODEL_LOCATION = 10`.
- The SQL migration must contain the supported-location seed contract, model/location/slot uniqueness, nullable physical assignment, and exact-model/exact-location filtering.

- [ ] **Step 1: Write the failing unit tests**

```ts
import { describe, expect, it } from "vitest";

import {
  INVENTORY_CAPACITY_PER_MODEL_LOCATION,
  remainingInventoryCapacity,
} from "@/lib/availability/inventory-capacity";

describe("model/location inventory capacity", () => {
  it("uses ten slots per model and pickup location", () => {
    expect(INVENTORY_CAPACITY_PER_MODEL_LOCATION).toBe(10);
    expect(remainingInventoryCapacity(0)).toBe(10);
    expect(remainingInventoryCapacity(7)).toBe(3);
    expect(remainingInventoryCapacity(10)).toBe(0);
    expect(remainingInventoryCapacity(14)).toBe(0);
  });
});
```

- [ ] **Step 2: Write the failing SQL-source tests**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "drizzle/0013_capacity_based_inventory.sql",
  "utf8",
);

describe("capacity migration", () => {
  it("creates ten unique slots per model and pickup location", () => {
    expect(migration).toContain("vehicle_inventory_slots");
    expect(migration).toContain("vehicle_model_id");
    expect(migration).toContain("pickup_location_id");
    expect(migration).toContain("slot_number");
    expect(migration).toContain("vehicle_inventory_slots_model_location_slot_uidx");
  });

  it("keeps physical assignment nullable and scopes holds exactly", () => {
    expect(migration).toMatch(/vehicle_id[\\s\\S]*DROP NOT NULL/);
    expect(migration).toContain("p_pickup_location_id");
    expect(migration).toContain("v.vehicle_model_id = p_vehicle_model_id");
    expect(migration).toContain("v.pickup_location_id = p_pickup_location_id");
  });
});
```

- [ ] **Step 3: Run the focused tests and confirm they fail for missing implementation**

Run: `npm exec vitest run --project unit tests/unit/fleet-capacity.test.ts tests/integration/phase13-capacity-sql.test.ts`

Expected: FAIL because the helper and migration do not exist yet.

- [ ] **Step 4: Commit the failing tests**

```powershell
git add tests/unit/fleet-capacity.test.ts tests/integration/phase13-capacity-sql.test.ts
git commit -m "test: define capacity inventory contract"
```

### Task 2: Add the inventory schema and migration

**Files:**
- Create: `src/lib/availability/inventory-capacity.ts`
- Create: `src/lib/db/schema/inventory.ts`
- Modify: `src/lib/db/schema/index.ts`
- Modify: `src/lib/db/schema/availability.ts`
- Create: `drizzle/0013_capacity_based_inventory.sql`
- Modify: `drizzle/meta/_journal.json` and generated snapshot metadata through Drizzle.

**Interfaces:**
- `remainingInventoryCapacity(occupied: number): number` clamps to `[0, 10]`.
- `vehicleInventorySlots` has `id`, `vehicleModelId`, `pickupLocationId`, `slotNumber`, and timestamps.
- `vehicleAllocations.inventorySlotId` is required for booking allocations and nullable for legacy physical-only allocations; `vehicleAllocations.vehicleId` becomes nullable.

- [ ] **Step 1: Implement the pure helper and Drizzle table definitions.**
- [ ] **Step 2: Generate the migration with the repository’s Drizzle workflow, then review every statement.**
- [ ] **Step 3: Add the three supported-location identifiers by stable slugs, not hard-coded UUIDs.**
- [ ] **Step 4: Provision slots 1–10 for every existing vehicle model and the three supported locations using an idempotent insert.**
- [ ] **Step 5: Add the nullable assignment constraint requiring a booking allocation to have an inventory slot, while allowing maintenance/manual blocks to remain physical-only.**
- [ ] **Step 6: Run the focused tests and confirm they pass.**

Run: `npm exec vitest run --project unit tests/unit/fleet-capacity.test.ts tests/integration/phase13-capacity-sql.test.ts`

- [ ] **Step 7: Commit the schema work.**

```powershell
git add src/lib/availability/inventory-capacity.ts src/lib/db/schema/inventory.ts src/lib/db/schema/index.ts src/lib/db/schema/availability.ts drizzle/0013_capacity_based_inventory.sql drizzle/meta
git commit -m "feat: add model location inventory capacity"
```

### Task 3: Make public availability exact and location-aware

**Files:**
- Modify: `src/lib/availability/get-available-models.ts`
- Modify: `src/lib/availability/create-hold.ts`
- Modify: `src/lib/quotes/create-quote.ts`
- Modify: `src/lib/validation/availability.ts` only if the supported-location validation belongs there.
- Test: `tests/unit/fleet-capacity.test.ts`

**Interfaces:**
- `getAvailableModels` returns `availableCount` based on slots for the requested `pickupLocation`, model, and date range.
- `createVehicleHold` accepts `pickupLocationId` and returns `allocationId`, `inventorySlotId`, and nullable `vehicleId`.
- `createQuoteAndHold` passes the resolved pickup location ID and exact model ID through to the database function.

- [ ] **Step 1: Add failing tests proving a model cannot borrow another model’s capacity and a location cannot borrow another location’s capacity.**
- [ ] **Step 2: Run the focused tests and confirm the old class-wide behavior fails them.**
- [ ] **Step 3: Replace physical-vehicle counting with free-slot counting for the exact model/location pair.**
- [ ] **Step 4: Update hold result parsing and quote creation to use inventory-slot IDs.**
- [ ] **Step 5: Run the focused unit tests and TypeScript check.**

Run: `npm exec vitest run --project unit tests/unit/fleet-capacity.test.ts`; `npm run typecheck`

- [ ] **Step 6: Commit the availability change.**

```powershell
git add src/lib/availability src/lib/quotes/create-quote.ts src/lib/validation/availability.ts tests/unit/fleet-capacity.test.ts
git commit -m "feat: enforce model location availability capacity"
```

### Task 4: Replace the PostgreSQL physical-vehicle hold with an atomic slot hold

**Files:**
- Modify: `drizzle/0013_capacity_based_inventory.sql`
- Modify: `src/lib/availability/create-hold.ts`
- Test: `tests/integration/phase13-capacity-sql.test.ts`

**Interfaces:**
- Replace the database function signature with `create_vehicle_hold(p_vehicle_model_id, p_pickup_location_id, p_pickup_at, p_return_at, p_quote_id, p_hold_minutes, p_created_by)`.
- Return `allocation_id`, `inventory_slot_id`, and nullable `vehicle_id`.

- [ ] **Step 1: Add failing SQL assertions for slot locking, active statuses, expired-hold cleanup, and the eleventh-reservation rejection.**
- [ ] **Step 2: Implement the function using `FOR UPDATE SKIP LOCKED` on free slots and the existing allocation overlap rules.**
- [ ] **Step 3: Keep the existing exclusion constraint for physical assignments and add a slot/date exclusion constraint for booking allocations.**
- [ ] **Step 4: Update the application parser and map database errors to the existing unavailable booking error.**
- [ ] **Step 5: Run SQL-source tests and the existing integration suite that does not require unavailable credentials.**
- [ ] **Step 6: Commit the atomic hold implementation.**

```powershell
git add drizzle/0013_capacity_based_inventory.sql src/lib/availability/create-hold.ts tests/integration/phase13-capacity-sql.test.ts
git commit -m "feat: reserve inventory slots atomically"
```

### Task 5: Add staff vehicle assignment before pickup

**Files:**
- Create: `src/lib/operations/assign-booking-vehicle.ts`
- Modify: `src/lib/operations/prepare-booking.ts`
- Modify: `src/lib/operations/booking-guards.ts`
- Modify: `src/lib/bookings/queries.ts`
- Modify: the relevant admin booking detail and pickup pages under `src/app/admin/(console)/bookings`.
- Create: `src/components/admin/operations/booking-vehicle-assignment-form.tsx`
- Test: `tests/unit/booking-vehicle-assignment.test.ts`

**Interfaces:**
- `assignBookingVehicle(input: { bookingId: string; vehicleId: string }): Promise<ActionState>`.
- The action verifies model, pickup location, `available` status, and no overlapping active allocation inside one transaction, then updates both booking and allocation.
- `prepareBookingForPickup` returns a clear assignment-required error when `booking.vehicleId` is null.

- [ ] **Step 1: Write failing tests for wrong model, wrong location, unavailable status, overlap, and valid assignment.**
- [ ] **Step 2: Run the tests and confirm they fail because the action does not exist.**
- [ ] **Step 3: Implement the transactional assignment action with role protection and audit logging.**
- [ ] **Step 4: Add the admin form filtered to the booking model and pickup location.**
- [ ] **Step 5: Make pickup preparation and handover block until assignment is present.**
- [ ] **Step 6: Run assignment tests and TypeScript checks.**
- [ ] **Step 7: Commit the assignment workflow.**

```powershell
git add src/lib/operations src/lib/bookings/queries.ts src/app/admin src/components/admin/operations tests/unit/booking-vehicle-assignment.test.ts
git commit -m "feat: assign physical vehicle before pickup"
```

### Task 6: Update existing operational queries and regression coverage

**Files:**
- Modify: `src/lib/maintenance/records.ts` only where booking allocations may now have null `vehicleId`.
- Modify: `src/lib/availability/staff-occupancy.ts` to distinguish unassigned capacity reservations from physical vehicle occupancy.
- Modify: `src/lib/bookings/queries.ts`, `src/lib/bookings/create-booking.ts`, and status transitions where non-null physical assignment was assumed too early.
- Modify: relevant admin table components to show “Unassigned” instead of failing on null vehicle data.
- Test: `tests/integration/phase13-capacity-assignment.test.ts`

**Interfaces:**
- Existing maintenance/manual-block APIs continue requiring a real physical `vehicleId`.
- Booking-facing operations continue requiring an assigned physical vehicle.
- Capacity-only booking allocations remain valid before assignment and do not appear as physical maintenance occupancy.

- [ ] **Step 1: Add regression tests for a capacity-only booking allocation and an existing physical maintenance allocation.**
- [ ] **Step 2: Run the tests and record all compile/type failures caused by nullable `vehicleId`.**
- [ ] **Step 3: Update each operational consumer with explicit assignment guards.**
- [ ] **Step 4: Run targeted tests, lint, and TypeScript checks.**
- [ ] **Step 5: Commit the compatibility changes.**

```powershell
git add src/lib/maintenance src/lib/availability/staff-occupancy.ts src/lib/bookings src/components/admin tests/integration/phase13-capacity-assignment.test.ts
git commit -m "fix: preserve operations with capacity reservations"
```

### Task 7: Apply and verify the Nii Plants production migration

**Files:**
- No source changes unless migration review identifies a defect.
- Evidence: Supabase SQL Editor results and Vercel deployment logs.

- [ ] **Step 1: Confirm the linked project reference is `hcaxtlqwhrmifgshfzsl` and inspect the migration SQL one final time.**
- [ ] **Step 2: Create a manual logical backup/export if available on the Free Plan; do not expose its credentials or file contents in chat.**
- [ ] **Step 3: Apply the migration to the Nii Plants production database only.**
- [ ] **Step 4: Verify exactly three supported locations, 10 slots per model/location, the new constraints, and migration ledger count 14.**
- [ ] **Step 5: Verify ten reservations can coexist and the eleventh is rejected for the same model/location/date range.**
- [ ] **Step 6: Push only after local checks are complete, then redeploy the Nii Plants Vercel project.**
- [ ] **Step 7: Verify `/api/health`, `/`, `/fleet`, `/news`, availability search, assignment, and pickup guard in production.**

## Final verification commands

```powershell
npm run typecheck
npm exec vitest run --project unit tests/unit/fleet-capacity.test.ts tests/unit/booking-vehicle-assignment.test.ts
npm exec vitest run --project unit tests/integration/phase13-capacity-sql.test.ts tests/integration/phase13-capacity-assignment.test.ts
npm run lint
npm run build
```

Do not report the feature complete unless the database verification and production route checks also pass.
