import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { createVehicleHold } from "@/lib/availability/create-hold";
import type { AppTransaction } from "@/lib/db";
import { bookings, vehicleAllocations } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { log } from "@/lib/logger";

export async function expireStaleAllocation(
  tx: AppTransaction,
  allocationId: string | null | undefined,
) {
  if (!allocationId) {
    return;
  }

  await tx
    .update(vehicleAllocations)
    .set({ status: "expired" })
    .where(
      and(
        eq(vehicleAllocations.id, allocationId),
        inArray(vehicleAllocations.status, ["hold", "confirmed", "ready"]),
      ),
    );
}

export async function confirmAllocation(
  tx: AppTransaction,
  allocationId: string | null | undefined,
) {
  if (!allocationId) {
    return;
  }

  await tx
    .update(vehicleAllocations)
    .set({ status: "confirmed", expiresAt: null })
    .where(
      and(
        eq(vehicleAllocations.id, allocationId),
        inArray(vehicleAllocations.status, ["hold", "confirmed", "ready"]),
      ),
    );
}

export async function hasLatePaymentCapacity(
  tx: AppTransaction,
  booking: typeof bookings.$inferSelect,
) {
  const result = await tx.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM vehicle_inventory_slots slot
      WHERE slot.vehicle_model_id = ${booking.vehicleModelId}::uuid
        AND slot.pickup_location_id = ${booking.pickupLocationId}::uuid
        AND NOT EXISTS (
          SELECT 1
          FROM vehicle_allocations va
          WHERE va.inventory_slot_id = slot.id
            AND va.start_at < ${booking.returnAt.toISOString()}::timestamptz
            AND va.end_at > ${booking.pickupAt.toISOString()}::timestamptz
            AND (
              va.status IN ('confirmed', 'ready', 'checked_out')
              OR (
                va.status = 'hold'
                AND va.expires_at IS NOT NULL
                AND va.expires_at > now()
              )
            )
        )
    ) AS available
  `);

  const rows = Array.isArray(result)
    ? result
    : result &&
        typeof result === "object" &&
        "rows" in result &&
        Array.isArray((result as { rows: unknown }).rows)
      ? (result as { rows: unknown[] }).rows
      : [];

  const row = rows[0];
  if (!row || typeof row !== "object") {
    return false;
  }

  const available = (row as { available?: boolean }).available;
  return available === true;
}

export async function attemptLatePaymentReallocation(
  tx: AppTransaction,
  booking: typeof bookings.$inferSelect,
) {
  const hasCapacity = await hasLatePaymentCapacity(tx, booking);
  if (!hasCapacity) {
    log("warn", "late_payment_reallocation_failed", {
      bookingId: booking.id,
      unavailable: "no_capacity",
    });
    return null;
  }

  const settings = await getSiteSettings();
  await tx.execute(sql`SAVEPOINT late_payment_reallocation`);
  try {
    const hold = await createVehicleHold(tx, {
      vehicleModelId: booking.vehicleModelId,
      pickupLocationId: booking.pickupLocationId,
      pickupAt: booking.pickupAt,
      returnAt: booking.returnAt,
      quoteId: booking.quoteId,
      holdMinutes: settings.holdDurationMinutes,
    });

    await tx
      .update(vehicleAllocations)
      .set({
        bookingId: booking.id,
        status: "confirmed",
        expiresAt: null,
      })
      .where(eq(vehicleAllocations.id, hold.allocationId));

    await tx
      .update(bookings)
      .set({
        vehicleAllocationId: hold.allocationId,
        vehicleId: hold.vehicleId,
      })
      .where(eq(bookings.id, booking.id));

    log("info", "late_payment_reallocated", {
      bookingId: booking.id,
      allocationId: hold.allocationId,
      vehicleId: hold.vehicleId,
    });

    await tx.execute(sql`RELEASE SAVEPOINT late_payment_reallocation`);

    return {
      allocationId: hold.allocationId,
      vehicleId: hold.vehicleId,
    };
  } catch (error) {
    await tx.execute(sql`ROLLBACK TO SAVEPOINT late_payment_reallocation`);
    log("warn", "late_payment_reallocation_failed", {
      bookingId: booking.id,
      unavailable: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function allocationHoldActive(
  tx: AppTransaction,
  allocationId: string | null | undefined,
) {
  if (!allocationId) {
    return false;
  }

  const [allocation] = await tx
    .select()
    .from(vehicleAllocations)
    .where(eq(vehicleAllocations.id, allocationId))
    .limit(1);

  return Boolean(
    allocation &&
      allocation.status === "hold" &&
      allocation.expiresAt &&
      allocation.expiresAt.getTime() > Date.now(),
  );
}

export async function lockBookingForPayment(
  tx: AppTransaction,
  bookingId: string,
) {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .for("update");
  return booking ?? null;
}
