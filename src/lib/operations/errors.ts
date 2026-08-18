import { BookingError } from "@/lib/booking/errors";

export class OperationsError extends BookingError {}

export function publicOperationsMessage(error: unknown): string {
  if (error instanceof BookingError) {
    return error.message;
  }
  return "We could not complete that operation. Please try again.";
}
