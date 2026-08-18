import type { InitialPaymentPurpose } from "@/lib/payments/constants";

export function determineInitialPaymentPurpose(input: {
  pickupAt: Date;
  now?: Date;
  balanceDueHours: number;
}): InitialPaymentPurpose {
  const now = input.now ?? new Date();
  const hoursUntilPickup = (input.pickupAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursUntilPickup <= input.balanceDueHours) {
    return "full_rental";
  }
  return "reservation";
}

export function initialPaymentAmount(input: {
  purpose: InitialPaymentPurpose;
  rentalTotal: number;
  reservationPaymentRequired: number;
}): number {
  if (input.purpose === "full_rental") {
    return input.rentalTotal;
  }
  return input.reservationPaymentRequired;
}
