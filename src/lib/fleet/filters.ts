import { ghsInputToPesewas } from "@/lib/money";

export type PublicFleetFilters = {
  classSlug?: string;
  minSeats?: number;
  transmission?: "automatic" | "manual";
  maxDailyRatePesewas?: number;
  maxPriceGhs?: string;
};

export type PublicFleetCandidate = {
  published: boolean;
  classActive: boolean;
  classSlug: string;
  seats: number;
  transmission: "automatic" | "manual";
  dailyRatePesewas: number;
};

export function matchesPublicFleetFilters(
  candidate: PublicFleetCandidate,
  filters: PublicFleetFilters = {},
): boolean {
  if (!candidate.published || !candidate.classActive) {
    return false;
  }

  if (filters.classSlug && candidate.classSlug !== filters.classSlug) {
    return false;
  }

  if (
    typeof filters.minSeats === "number" &&
    candidate.seats < filters.minSeats
  ) {
    return false;
  }

  if (filters.transmission && candidate.transmission !== filters.transmission) {
    return false;
  }

  if (
    typeof filters.maxDailyRatePesewas === "number" &&
    candidate.dailyRatePesewas > filters.maxDailyRatePesewas
  ) {
    return false;
  }

  return true;
}

export function hasActivePublicFleetFilters(filters: PublicFleetFilters): boolean {
  return Boolean(
    filters.classSlug ||
      filters.minSeats ||
      filters.transmission ||
      filters.maxPriceGhs,
  );
}

export function parseFleetSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): PublicFleetFilters {
  const classSlug = firstParam(searchParams.class);
  const transmission = firstParam(searchParams.transmission);
  const minSeatsValue = firstParam(searchParams.seats);
  const maxPriceGhs = firstParam(searchParams.maxPrice);
  const minSeats = minSeatsValue ? Number.parseInt(minSeatsValue, 10) : undefined;
  let maxDailyRatePesewas: number | undefined;

  if (maxPriceGhs) {
    try {
      maxDailyRatePesewas = ghsInputToPesewas(maxPriceGhs);
    } catch {
      maxDailyRatePesewas = undefined;
    }
  }

  return {
    classSlug: classSlug || undefined,
    transmission:
      transmission === "automatic" || transmission === "manual"
        ? transmission
        : undefined,
    minSeats:
      typeof minSeats === "number" && Number.isInteger(minSeats) && minSeats > 0
        ? minSeats
        : undefined,
    maxDailyRatePesewas,
    maxPriceGhs: maxPriceGhs || undefined,
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
