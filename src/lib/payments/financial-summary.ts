import type { PaymentPurpose } from "@/lib/payments/types";

export function rentalPaymentPurpose(purpose: PaymentPurpose): boolean {
  return purpose === "reservation" || purpose === "full_rental" || purpose === "balance";
}

export function sumSuccessfulRentalPayments(
  rows: { purpose: PaymentPurpose; amount: number }[],
): number {
  return rows.reduce((total, row) => {
    if (!rentalPaymentPurpose(row.purpose)) {
      return total;
    }
    return total + row.amount;
  }, 0);
}

export function computeRemainingBalance(rentalTotal: number, amountPaid: number): number {
  return Math.max(0, rentalTotal - amountPaid);
}
