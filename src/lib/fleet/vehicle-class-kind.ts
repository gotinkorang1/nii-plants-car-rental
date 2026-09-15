export type VehicleClassKind =
  | "sedan"
  | "suv"
  | "offroad"
  | "van"
  | "coach"
  | "other";

export function vehicleClassKind(name?: string): VehicleClassKind {
  const value = (name ?? "").toLowerCase();

  if (/coach|bus|coaster/.test(value)) {
    return "coach";
  }

  if (/van|hiace/.test(value)) {
    return "van";
  }

  if (/4x4|prado|land cruiser/.test(value)) {
    return "offroad";
  }

  if (/suv/.test(value)) {
    return "suv";
  }

  if (/sedan|saloon/.test(value)) {
    return "sedan";
  }

  return "other";
}
