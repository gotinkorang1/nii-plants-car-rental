# Capacity-Based Fleet Reservations

## Goal

Support a fixed inventory capacity of 10 vehicles for every published vehicle model at every active pickup location. A customer reservation must consume one model/location capacity slot for its date range, while the specific physical car number may be assigned by staff later.

## Current constraint

The current reservation flow selects and holds a physical row from `vehicles`. Availability is counted by vehicle class, and the PostgreSQL hold function can select a different model than the requested model. Operations also assumes that every confirmed booking already has a physical `vehicle_id`.

## Recommended architecture

Add a model/location inventory table with one row per capacity slot:

- `vehicle_inventory_slots.id`
- `vehicle_inventory_slots.vehicle_model_id`
- `vehicle_inventory_slots.pickup_location_id`
- `vehicle_inventory_slots.slot_number` from 1 through 10
- unique `(vehicle_model_id, pickup_location_id, slot_number)`

Change `vehicle_allocations` so a booking allocation references an inventory slot and may leave `vehicle_id` null until staff assignment. Existing physical-vehicle allocations remain supported for maintenance and already-assigned operational records.

Add a booking assignment action that validates the selected physical vehicle belongs to the requested model and pickup location, is operationally available, and is not already occupied during the booking window. The action attaches the vehicle to the booking/allocation before pickup preparation.

## Data flow

1. Availability search counts unexpired holds and active reservations for the requested model, pickup location, and date range, returning `10 - occupied`.
2. Quote creation validates the requested model and locations, then atomically reserves one free inventory slot.
3. Payment and booking transitions continue to operate on the allocation record.
4. Staff assigns a physical vehicle before handover. Assignment is locked and checked inside a transaction.
5. Pickup, inspection, checkout, maintenance, and return flows require the assignment and continue using the existing physical vehicle workflow.

## Database safety

- Use a new Drizzle migration with backward-compatible nullable `vehicle_id` handling.
- Add foreign keys and indexes for inventory slots and allocation lookups.
- Enforce slot/date overlap with a PostgreSQL exclusion constraint or an equivalent transaction-safe locking query.
- Keep existing allocations with `vehicle_id` intact.
- Do not fabricate registration numbers or physical vehicle rows.

## UI and operations

- Public availability displays the remaining quantity for each model at the selected pickup location.
- Admin booking preparation shows “Vehicle assignment required” until a physical car is selected.
- Add a vehicle-assignment control filtered to the booking’s model and pickup location.
- Do not expose registration numbers on public fleet pages.

## Error handling

- A model/location with all 10 slots occupied returns the existing unavailable response.
- Assignment rejects an inactive, maintenance, wrong-model, wrong-location, or overlapping physical vehicle.
- A booking cannot be handed over without a physical vehicle assignment.
- Failed assignments leave the capacity reservation intact so staff can choose another vehicle.

## Testing and rollout

1. Add failing unit and SQL-source tests for the capacity, model, and location rules.
2. Implement schema and allocation changes.
3. Add tests for concurrent tenth/eleventh reservations and assignment validation.
4. Run typecheck, targeted unit/integration tests, lint, and production build.
5. Apply the migration to the linked Nii Plants Supabase project only.
6. Verify availability, booking creation, assignment, pickup blocking, and `/api/health` in the production deployment.

## Explicit non-goals

- No automatic creation of fake physical cars.
- No changes to Paper Source or any other Vercel/Supabase project.
- No change to pricing, payment provider behavior, or public registration-number visibility.
