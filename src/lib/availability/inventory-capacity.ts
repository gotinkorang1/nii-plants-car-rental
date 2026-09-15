export const INVENTORY_CAPACITY_PER_MODEL_LOCATION = 10;

export function remainingInventoryCapacity(occupied: number): number {
  return Math.max(
    0,
    INVENTORY_CAPACITY_PER_MODEL_LOCATION - Math.max(0, occupied),
  );
}
