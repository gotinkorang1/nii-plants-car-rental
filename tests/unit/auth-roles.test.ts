import { describe, expect, it } from "vitest";

import {
  hasRequiredRole,
  isStaffRole,
  STAFF_ROLES,
} from "@/lib/auth/roles";

describe("staff roles", () => {
  it("accepts the Version 1 staff roles", () => {
    expect(STAFF_ROLES).toEqual([
      "administrator",
      "reservations",
      "fleet",
      "finance",
      "content_editor",
    ]);

    for (const role of STAFF_ROLES) {
      expect(isStaffRole(role)).toBe(true);
    }
  });

  it("rejects unknown roles", () => {
    expect(isStaffRole("superadmin")).toBe(false);
    expect(isStaffRole("")).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });

  it("gives administrators access to every role check", () => {
    expect(hasRequiredRole("administrator", "fleet")).toBe(true);
    expect(
      hasRequiredRole("administrator", ["finance", "content_editor"]),
    ).toBe(true);
  });

  it("allows only the listed roles for non-administrators", () => {
    expect(hasRequiredRole("fleet", "fleet")).toBe(true);
    expect(hasRequiredRole("fleet", ["fleet", "reservations"])).toBe(true);
    expect(hasRequiredRole("fleet", "finance")).toBe(false);
    expect(hasRequiredRole("content_editor", ["reservations"])).toBe(false);
  });
});
