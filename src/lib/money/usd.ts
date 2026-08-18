/**
 * Published shop prices are in USD. Paystack still charges GHS.
 *
 * Bank of Ghana interbank selling rate on 18 August 2026 was about
 * GH¢11.00 per US dollar. Booking GHS amounts are this rate times the
 * published USD floor, stored as integer pesewas. Staff should confirm
 * live cedi tariffs in admin if the shop rate changes.
 */
export const USD_GHS_BOOKING_RATE = 11;

export function usdToPesewas(usd: number): number {
  if (!Number.isInteger(usd) || usd < 0) {
    throw new Error("USD amounts must be whole dollars.");
  }

  return usd * USD_GHS_BOOKING_RATE * 100;
}

export function formatUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatUsdDailyRate(from: number, to: number | null = from): string {
  if (to === null || to <= from) {
    return formatUsd(from);
  }

  return `${formatUsd(from)}–${formatUsd(to)}`;
}

export function normalizeUsdDailyRange(
  from: number | undefined,
  to: number | undefined,
): { usdDailyRateFrom: number | null; usdDailyRateTo: number | null } {
  if (from === undefined && to === undefined) {
    return { usdDailyRateFrom: null, usdDailyRateTo: null };
  }

  const low = from ?? to;
  const high = to ?? from;

  if (low === undefined || high === undefined || high < low) {
    throw new Error("USD daily rate to cannot be less than from.");
  }

  return { usdDailyRateFrom: low, usdDailyRateTo: high };
}
