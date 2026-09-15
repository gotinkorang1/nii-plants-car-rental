export type PublicSearchLocation = {
  slug: string;
  name: string;
  type?: string | null;
};

export const SUPPORTED_OFFICE_PICKUP_LOCATION_SLUGS = [
  "alisa-hotel-ridge",
  "alisa-hotel-tema",
  "head-office-dansoman",
] as const;

const LOCATION_TYPE_LABELS: Record<string, string> = {
  branch: "Office",
  airport: "Airport",
  city: "City",
  pickup_point: "Hotel desk",
  service_area: "Area",
};

export function locationTypeLabel(type: string | null | undefined): string | null {
  if (!type) {
    return null;
  }
  return LOCATION_TYPE_LABELS[type] ?? null;
}

export function locationOptionLabel(
  name: string,
  type?: string | null,
): string {
  const kind = locationTypeLabel(type);
  return kind ? `${name} · ${kind}` : name;
}
