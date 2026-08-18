const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateChargeableDays(pickupAt: Date, returnAt: Date): number {
  if (!(pickupAt instanceof Date) || Number.isNaN(pickupAt.getTime())) {
    throw new Error("Pickup time is invalid.");
  }

  if (!(returnAt instanceof Date) || Number.isNaN(returnAt.getTime())) {
    throw new Error("Return time is invalid.");
  }

  const durationMs = returnAt.getTime() - pickupAt.getTime();
  if (durationMs <= 0) {
    throw new Error("Return must be after pickup.");
  }

  const wholeDays = Math.trunc(durationMs / MILLISECONDS_PER_DAY);
  const remainderMs = durationMs % MILLISECONDS_PER_DAY;
  return remainderMs === 0 ? wholeDays : wholeDays + 1;
}
