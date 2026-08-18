import { describe, expect, it } from "vitest";

import {
  canTransitionBookingStatus,
  customerStatusLabel,
} from "@/lib/bookings/status";

describe("booking status transitions", () => {
  it("allows the Version 1 pre-payment path", () => {
    expect(canTransitionBookingStatus("draft", "held")).toBe(true);
    expect(canTransitionBookingStatus("held", "payment_pending")).toBe(true);
    expect(canTransitionBookingStatus("payment_pending", "expired")).toBe(true);
    expect(canTransitionBookingStatus("payment_pending", "cancelled")).toBe(true);
    expect(canTransitionBookingStatus("payment_pending", "confirmed")).toBe(true);
  });

  it("rejects illegal recoveries", () => {
    expect(canTransitionBookingStatus("completed", "draft")).toBe(false);
    expect(canTransitionBookingStatus("cancelled", "confirmed")).toBe(false);
    expect(canTransitionBookingStatus("expired", "confirmed")).toBe(false);
  });

  it("maps internal statuses to customer copy", () => {
    expect(customerStatusLabel("payment_pending")).toBe("Payment required");
    expect(customerStatusLabel("expired")).toBe("Booking expired");
    expect(customerStatusLabel("draft")).not.toBe("draft");
  });
});
