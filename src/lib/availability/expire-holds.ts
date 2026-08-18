import "server-only";

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { vehicleAllocations } from "@/lib/db/schema";
import { log } from "@/lib/logger";

export async function expireVehicleHolds(): Promise<number> {
  const db = tryGetDb();
  if (!db) {
    return 0;
  }

  const expired = await db
    .update(vehicleAllocations)
    .set({ status: "expired" })
    .where(
      and(
        eq(vehicleAllocations.status, "hold"),
        isNotNull(vehicleAllocations.expiresAt),
        sql`${vehicleAllocations.expiresAt} <= now()`,
      ),
    )
    .returning({ id: vehicleAllocations.id });

  if (expired.length > 0) {
    log("info", "hold_expired", { count: expired.length });
  }

  return expired.length;
}
