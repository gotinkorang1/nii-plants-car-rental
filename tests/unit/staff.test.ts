import { describe, expect, it } from "vitest";

import { canManageStaff } from "@/lib/staff/permissions";
import {
  LAST_ADMINISTRATOR_MESSAGE,
  wouldRemoveLastAdministrator,
} from "@/lib/staff/lockout";
import {
  inviteStaffSchema,
  setStaffPasswordSchema,
  updateStaffSchema,
} from "@/lib/validation/staff";

describe("staff management permissions", () => {
  it("lets only administrators manage staff", () => {
    expect(canManageStaff("administrator")).toBe(true);
    expect(canManageStaff("reservations")).toBe(false);
    expect(canManageStaff("fleet")).toBe(false);
    expect(canManageStaff("finance")).toBe(false);
    expect(canManageStaff("content_editor")).toBe(false);
  });
});

describe("last administrator lockout", () => {
  it("blocks deactivating the only active administrator", () => {
    expect(
      wouldRemoveLastAdministrator({
        currentRole: "administrator",
        currentActive: true,
        nextRole: "administrator",
        nextActive: false,
        activeAdministratorCount: 1,
      }),
    ).toBe(true);
  });

  it("blocks demoting the only active administrator", () => {
    expect(
      wouldRemoveLastAdministrator({
        currentRole: "administrator",
        currentActive: true,
        nextRole: "fleet",
        nextActive: true,
        activeAdministratorCount: 1,
      }),
    ).toBe(true);
    expect(LAST_ADMINISTRATOR_MESSAGE).toMatch(/administrator/i);
  });

  it("allows the last administrator to change their display details", () => {
    expect(
      wouldRemoveLastAdministrator({
        currentRole: "administrator",
        currentActive: true,
        nextRole: "administrator",
        nextActive: true,
        activeAdministratorCount: 1,
      }),
    ).toBe(false);
  });

  it("allows demotion when another administrator remains", () => {
    expect(
      wouldRemoveLastAdministrator({
        currentRole: "administrator",
        currentActive: true,
        nextRole: "content_editor",
        nextActive: true,
        activeAdministratorCount: 2,
      }),
    ).toBe(false);
  });

  it("does not treat inactive or non-admin accounts as the last administrator", () => {
    expect(
      wouldRemoveLastAdministrator({
        currentRole: "fleet",
        currentActive: true,
        nextRole: "fleet",
        nextActive: false,
        activeAdministratorCount: 1,
      }),
    ).toBe(false);
  });
});

describe("staff validation", () => {
  it("normalises invite email and requires a role", () => {
    const parsed = inviteStaffSchema.parse({
      displayName: "  Ama  ",
      email: "Ama@Example.com",
      role: "reservations",
    });

    expect(parsed).toEqual({
      displayName: "Ama",
      email: "ama@example.com",
      role: "reservations",
    });
  });

  it("rejects an empty display name", () => {
    expect(
      inviteStaffSchema.safeParse({
        displayName: "   ",
        email: "staff@example.com",
        role: "fleet",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(
      updateStaffSchema.safeParse({
        displayName: "Ama",
        role: "superadmin",
        active: true,
      }).success,
    ).toBe(false);
  });

  it("requires matching passwords of at least eight characters", () => {
    expect(
      setStaffPasswordSchema.safeParse({
        password: "long-enough",
        confirmPassword: "long-enough",
      }).success,
    ).toBe(true);
    expect(
      setStaffPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      setStaffPasswordSchema.safeParse({
        password: "long-enough",
        confirmPassword: "different1",
      }).success,
    ).toBe(false);
  });
});
