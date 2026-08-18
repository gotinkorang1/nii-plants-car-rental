import "server-only";

import type { bookings, vehicleAllocations } from "@/lib/db/schema";
import { OperationsError } from "@/lib/operations/errors";

export async function assertVehicleAssignment(
  booking: typeof bookings.$inferSelect,
  allocation: typeof vehicleAllocations.$inferSelect | null,
) {
  if (!booking.vehicleId || !booking.vehicleAllocationId || !allocation) {
    throw new OperationsError(
      "INVALID_STATUS_TRANSITION",
      "This booking does not have an assigned vehicle.",
    );
  }
  if (allocation.vehicleId !== booking.vehicleId) {
    throw new OperationsError(
      "INVALID_STATUS_TRANSITION",
      "Assigned vehicle does not match the booking allocation.",
    );
  }
}
