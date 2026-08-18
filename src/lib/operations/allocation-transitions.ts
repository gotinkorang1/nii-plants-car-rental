import "server-only";

import { and, eq } from "drizzle-orm";

import type { AppTransaction } from "@/lib/db";
import { bookings, vehicleAllocations, vehicles } from "@/lib/db/schema";
import type { allocationStatusEnum } from "@/lib/db/schema/enums";

type AllocationStatus = (typeof allocationStatusEnum.enumValues)[number];

export async function lockOperationalBooking(tx: AppTransaction, bookingId: string) {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .for("update");
  return booking ?? null;
}

export async function lockOperationalAllocation(
  tx: AppTransaction,
  allocationId: string | null | undefined,
) {
  if (!allocationId) {
    return null;
  }
  const [allocation] = await tx
    .select()
    .from(vehicleAllocations)
    .where(eq(vehicleAllocations.id, allocationId))
    .for("update");
  return allocation ?? null;
}

export async function lockOperationalVehicle(tx: AppTransaction, vehicleId: string) {
  const [vehicle] = await tx
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .for("update");
  return vehicle ?? null;
}

export async function transitionAllocationStatus(
  tx: AppTransaction,
  input: {
    allocationId: string;
    fromStatus: AllocationStatus;
    toStatus: AllocationStatus;
  },
) {
  await tx
    .update(vehicleAllocations)
    .set({ status: input.toStatus })
    .where(
      and(
        eq(vehicleAllocations.id, input.allocationId),
        eq(vehicleAllocations.status, input.fromStatus),
      ),
    );
}
