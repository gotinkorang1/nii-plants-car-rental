/**
 * Provider-independent normalization helpers.
 *
 * These are pure functions so they can be unit tested without network access.
 * Provider field names live in the adapter (for example `cardatabase.ts`);
 * only units, enums and labels are normalized here.
 */

const HP_PER_KW = 1.35962;

/** Plausible ranges, used to drop values whose unit we could not establish. */
const DIMENSION_RANGES_MM = {
  length: [1000, 25000],
  width: [1000, 3500],
  height: [800, 5000],
  wheelbase: [1000, 12000],
} as const;

export type DimensionKind = keyof typeof DIMENSION_RANGES_MM;
export type LengthUnit = "mm" | "cm" | "m";

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toPositiveInteger(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  if (parsed === null) {
    return null;
  }

  const rounded = Math.round(parsed);
  return rounded > 0 ? rounded : null;
}

export function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function hpToKw(hp: number): number {
  return roundTo(hp / HP_PER_KW, 1);
}

export function kwToHp(kw: number): number {
  return Math.round(kw * HP_PER_KW);
}

/**
 * Converts a length to millimetres.
 *
 * When the provider declares a unit we trust it. Otherwise we infer from
 * magnitude and reject anything outside a plausible range for that dimension,
 * so an unknown unit is dropped rather than stored as a wrong number.
 */
export function toMillimetres(
  value: unknown,
  kind: DimensionKind,
  unit?: LengthUnit,
): number | null {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed <= 0) {
    return null;
  }

  const [min, max] = DIMENSION_RANGES_MM[kind];

  if (unit) {
    const factor = unit === "m" ? 1000 : unit === "cm" ? 10 : 1;
    const millimetres = Math.round(parsed * factor);
    return millimetres >= min && millimetres <= max ? millimetres : null;
  }

  for (const candidate of [parsed, parsed * 10, parsed * 1000]) {
    const millimetres = Math.round(candidate);
    if (millimetres >= min && millimetres <= max) {
      return millimetres;
    }
  }

  return null;
}

export function normalizeTransmission(
  value: unknown,
): "automatic" | "manual" | null {
  const raw = toTrimmedString(value)?.toLowerCase();
  if (!raw) {
    return null;
  }

  const automaticHints = [
    "automatic",
    "auto",
    "cvt",
    "dct",
    "dsg",
    "pdk",
    "tiptronic",
    "s tronic",
    "s-tronic",
    "torque converter",
    "single-speed",
    "single speed",
    "1-speed",
    "one-speed",
    "reduction gear",
  ];

  if (automaticHints.some((hint) => raw.includes(hint))) {
    return "automatic";
  }

  if (raw.includes("manual") || raw === "mt") {
    return "manual";
  }

  return null;
}

export function normalizeFuelType(
  value: unknown,
  options: { isEv?: boolean } = {},
): "petrol" | "diesel" | "hybrid" | "electric" | null {
  const raw = toTrimmedString(value)?.toLowerCase() ?? "";

  // Checked before "electric" so that "plug-in hybrid electric" maps to hybrid.
  const hybridHints = ["hybrid", "phev", "mhev", "hev", "plug-in", "plug in"];
  if (hybridHints.some((hint) => raw.includes(hint))) {
    return "hybrid";
  }

  if (raw.includes("electric") || raw === "ev" || raw === "bev") {
    return "electric";
  }

  if (raw.includes("diesel") || raw.includes("tdi")) {
    return "diesel";
  }

  if (
    raw.includes("petrol") ||
    raw.includes("gasoline") ||
    raw.includes("benzin") ||
    raw === "gas"
  ) {
    return "petrol";
  }

  if (!raw && options.isEv) {
    return "electric";
  }

  return null;
}

export function isElectrified(
  fuelType: "petrol" | "diesel" | "hybrid" | "electric" | null,
  isEvFlag?: boolean,
): boolean {
  return Boolean(isEvFlag) || fuelType === "electric" || fuelType === "hybrid";
}

export function normalizeConnectors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = toTrimmedString(value);
    return single ? [single] : [];
  }

  const seen = new Set<string>();
  for (const entry of value) {
    const label = toTrimmedString(entry);
    if (label) {
      seen.add(label);
    }
  }

  return [...seen];
}

/** Suggestion line shown in the autocomplete listbox, e.g. "2022 Toyota Corolla LE". */
export function buildSuggestionLabel(input: {
  make: string;
  model: string;
  year?: number | null;
  trim?: string | null;
}): string {
  return [input.year ? String(input.year) : null, input.make, input.model, input.trim]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Secondary line, e.g. "Sedan · Electric". */
export function buildSuggestionDetail(
  parts: (string | null | undefined)[],
): string {
  return parts
    .map((part) => toTrimmedString(part))
    .filter((part): part is string => Boolean(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}
