export const BOOKING_STATUSES = [
  "draft",
  "held",
  "payment_pending",
  "confirmed",
  "ready",
  "checked_out",
  "completed",
  "cancelled",
  "expired",
  "under_review",
  "rejected",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CUSTOMER_STATUS_COPY: Record<BookingStatus, string> = {
  draft: "Booking being prepared",
  held: "Vehicle temporarily held",
  payment_pending: "Payment required",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  checked_out: "Rental in progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Booking expired",
  under_review: "Payment received — availability review",
  rejected: "Unable to proceed",
};

export const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["held", "cancelled", "expired"],
  held: ["payment_pending", "expired", "cancelled"],
  payment_pending: ["confirmed", "expired", "cancelled", "under_review"],
  under_review: ["payment_pending", "rejected", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["checked_out", "cancelled"],
  checked_out: ["completed"],
  completed: [],
  cancelled: [],
  expired: [],
  rejected: [],
};

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return ALLOWED_BOOKING_TRANSITIONS[from].includes(to);
}

export function customerStatusLabel(status: BookingStatus): string {
  return CUSTOMER_STATUS_COPY[status];
}

export const CUSTOMER_TIMELINE: BookingStatus[] = [
  "payment_pending",
  "confirmed",
  "ready",
  "checked_out",
  "completed",
];

export const CUSTOMER_TIMELINE_LABELS: Partial<Record<BookingStatus, string>> = {
  payment_pending: "Payment required",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  checked_out: "Vehicle collected",
  completed: "Completed",
};
