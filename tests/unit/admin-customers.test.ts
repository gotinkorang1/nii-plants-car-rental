import { describe, expect, it } from "vitest";

import { canViewCustomers } from "@/lib/customers/permissions";
import {
  customerMatchesAdminSearch,
  summarizeCustomerHires,
} from "@/lib/customers/summarize";

describe("customer CRM RBAC", () => {
  it("matches booking view access and keeps content editors out", () => {
    expect(canViewCustomers("content_editor")).toBe(false);
    expect(canViewCustomers("fleet")).toBe(true);
    expect(canViewCustomers("finance")).toBe(true);
    expect(canViewCustomers("reservations")).toBe(true);
    expect(canViewCustomers("administrator")).toBe(true);
  });
});

describe("customer admin search", () => {
  const ama = {
    firstName: "Ama",
    lastName: "Mensah",
    email: "ama@example.com",
    phone: "+233241234567",
    bookingReferences: ["NP-2608-A7K4"],
  };

  it("matches name, email, phone, and booking reference", () => {
    expect(customerMatchesAdminSearch(ama, "Ama")).toBe(true);
    expect(customerMatchesAdminSearch(ama, "mensah")).toBe(true);
    expect(customerMatchesAdminSearch(ama, "ama@example.com")).toBe(true);
    expect(customerMatchesAdminSearch(ama, "241234")).toBe(true);
    expect(customerMatchesAdminSearch(ama, "NP-2608-A7K4")).toBe(true);
    expect(customerMatchesAdminSearch(ama, "np-2608")).toBe(true);
  });

  it("does not match unrelated terms", () => {
    expect(customerMatchesAdminSearch(ama, "Kojo")).toBe(false);
    expect(customerMatchesAdminSearch(ama, "NP-9999")).toBe(false);
  });

  it("treats blank search as a match", () => {
    expect(customerMatchesAdminSearch(ama, "   ")).toBe(true);
  });
});

describe("customer hire summary", () => {
  it("counts hires, uses the newest booking for status, and sums open balances in pesewas", () => {
    const summary = summarizeCustomerHires([
      {
        reference: "NP-2608-OLD1",
        status: "completed",
        pickupAt: new Date("2026-01-02T10:00:00.000Z"),
        remainingBalance: 0,
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
      {
        reference: "NP-2608-NEW1",
        status: "confirmed",
        pickupAt: new Date("2026-08-20T10:00:00.000Z"),
        remainingBalance: 26250,
        createdAt: new Date("2026-08-18T10:00:00.000Z"),
      },
      {
        reference: "NP-2608-CANC",
        status: "cancelled",
        pickupAt: new Date("2026-07-01T10:00:00.000Z"),
        remainingBalance: 10000,
        createdAt: new Date("2026-06-30T10:00:00.000Z"),
      },
    ]);

    expect(summary.bookingCount).toBe(3);
    expect(summary.lastReference).toBe("NP-2608-NEW1");
    expect(summary.lastStatus).toBe("confirmed");
    expect(summary.lastPickupAt?.toISOString()).toBe("2026-08-20T10:00:00.000Z");
    expect(summary.outstandingBalance).toBe(26250);
  });

  it("returns empty summary fields when there are no hires", () => {
    const summary = summarizeCustomerHires([]);
    expect(summary.bookingCount).toBe(0);
    expect(summary.lastReference).toBeNull();
    expect(summary.lastStatus).toBeNull();
    expect(summary.lastPickupAt).toBeNull();
    expect(summary.outstandingBalance).toBe(0);
  });
});
