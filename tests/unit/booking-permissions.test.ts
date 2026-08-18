import { describe, expect, it } from "vitest";

import { bookingCreatedEmail } from "@/lib/email/templates";
import { canOperateBookings, canViewBookings } from "@/lib/bookings/permissions";
import { customerDetailsSchema } from "@/lib/validation/booking";

describe("booking email copy", () => {
  it("does not describe the booking as confirmed", () => {
    const email = bookingCreatedEmail({
      firstName: "Ama",
      email: "ama@example.com",
      reference: "NP-2608-ABCD",
      vehicleLabel: "Hyundai Accent or similar",
      pickupLabel: "2026-09-01 10:00",
      returnLabel: "2026-09-03 10:00",
      rentalTotal: 35000,
      reservationPaymentRequired: 8750,
      remainingBalance: 26250,
      securityDepositRequired: 150000,
      accessUrl: "http://127.0.0.1:3000/booking",
    });
    expect(email.subject.toLowerCase()).not.toContain("confirmed");
    expect(email.text.toLowerCase()).toContain("payment is required");
    expect(email.text.toLowerCase()).not.toContain("your booking is confirmed");
  });
});

describe("booking RBAC", () => {
  it("keeps content editors out of bookings", () => {
    expect(canViewBookings("content_editor")).toBe(false);
    expect(canOperateBookings("fleet")).toBe(false);
    expect(canOperateBookings("finance")).toBe(false);
    expect(canViewBookings("fleet")).toBe(true);
    expect(canViewBookings("finance")).toBe(true);
    expect(canOperateBookings("reservations")).toBe(true);
    expect(canOperateBookings("administrator")).toBe(true);
  });
});

describe("customer details schema", () => {
  it("ignores client-supplied prices", () => {
    const parsed = customerDetailsSchema.parse({
      quoteId: "550e8400-e29b-41d4-a716-446655440000",
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama@example.com",
      phone: "0241234567",
      driverAge: 30,
      licenceCountry: "Ghana",
      rentalTotal: 1,
      securityDeposit: 1,
      vehicleId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(parsed).not.toHaveProperty("rentalTotal");
    expect(parsed).not.toHaveProperty("vehicleId");
    expect(parsed.email).toBe("ama@example.com");
  });
});
