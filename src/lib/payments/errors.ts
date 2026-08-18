export const PAYMENT_ERROR_CODES = [
  "PAYMENT_NOT_FOUND",
  "PAYMENT_NOT_ALLOWED",
  "PAYMENT_ALREADY_ACTIVE",
  "PAYMENT_REVIEW_REQUIRED",
  "PAYSTACK_NOT_CONFIGURED",
  "PAYSTACK_INITIALIZATION_FAILED",
  "BOOKING_NOT_FOUND",
  "BOOKING_ACCESS_DENIED",
  "INVALID_SIGNATURE",
  "PROVIDER_MISMATCH",
] as const;

export type PaymentErrorCode = (typeof PAYMENT_ERROR_CODES)[number];

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

export function publicPaymentMessage(error: unknown): string {
  if (error instanceof PaymentError) {
    return error.message;
  }

  return "We could not complete that payment request. Please try again.";
}
