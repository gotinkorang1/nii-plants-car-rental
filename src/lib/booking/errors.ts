export const BOOKING_ERROR_CODES = [
  "PICKUP_IN_PAST",
  "INVALID_TIME_RANGE",
  "DURATION_TOO_SHORT",
  "INVALID_LOCATION",
  "INACTIVE_VEHICLE_CLASS",
  "UNPUBLISHED_MODEL",
  "INACTIVE_EXTRA",
  "INVALID_QUANTITY",
  "INVALID_PROMO",
  "PROMO_EXPIRED",
  "PROMO_UNAVAILABLE",
  "VEHICLE_UNAVAILABLE",
  "QUOTE_EXPIRED",
  "HOLD_EXPIRED",
  "QUOTE_ALREADY_BOOKED",
  "INVALID_STATUS_TRANSITION",
  "BOOKING_NOT_FOUND",
  "BOOKING_ACCESS_DENIED",
  "OTP_INVALID",
  "OTP_EXPIRED",
  "OTP_LOCKED",
  "BOOKING_DISABLED",
] as const;

export type BookingErrorCode = (typeof BOOKING_ERROR_CODES)[number];

export class BookingError extends Error {
  readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

export function publicBookingMessage(error: unknown): string {
  if (error instanceof BookingError) {
    return error.message;
  }

  return "We could not complete that request. Please try again.";
}

export function isExclusionViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: string; message?: string };
  return (
    record.code === "23P01" ||
    (typeof record.message === "string" &&
      record.message.toLowerCase().includes("exclusion"))
  );
}

export function isVehicleUnavailableError(error: unknown): boolean {
  if (error instanceof BookingError && error.code === "VEHICLE_UNAVAILABLE") {
    return true;
  }

  if (isExclusionViolation(error)) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: string; message?: string };
  return (
    record.message === "VEHICLE_UNAVAILABLE" ||
    (typeof record.message === "string" &&
      record.message.includes("VEHICLE_UNAVAILABLE"))
  );
}

export function mapHoldError(error: unknown): BookingError {
  if (error instanceof BookingError) {
    return error;
  }

  if (isVehicleUnavailableError(error)) {
    return new BookingError(
      "VEHICLE_UNAVAILABLE",
      "That vehicle was just reserved for these dates. Please choose another available option.",
    );
  }

  return new BookingError(
    "VEHICLE_UNAVAILABLE",
    "That vehicle was just reserved for these dates. Please choose another available option.",
  );
}
