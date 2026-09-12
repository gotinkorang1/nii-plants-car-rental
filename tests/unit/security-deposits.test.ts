import { describe, expect, it } from "vitest";

import {
  deriveDepositStatus,
  matchesSecurityDepositSearch,
  parseSecurityDepositStatus,
  SECURITY_DEPOSIT_STATUSES,
  securityDepositCollectionMethodLabel,
  securityDepositStatusLabel,
} from "@/lib/operations/deposit-status";
import {
  canMutateSecurityDeposit,
  canViewSecurityDeposits,
} from "@/lib/operations/permissions";

describe("security deposit statuses", () => {
  it("uses the database enum and does not invent withheld or pending", () => {
    expect([...SECURITY_DEPOSIT_STATUSES]).toEqual([
      "required",
      "collected",
      "partially_collected",
      "held",
      "released",
      "retained",
      "not_required",
    ]);
    expect(SECURITY_DEPOSIT_STATUSES).not.toContain("withheld");
    expect(SECURITY_DEPOSIT_STATUSES).not.toContain("pending");
    expect(securityDepositStatusLabel("retained")).toBe("Retained");
    expect(parseSecurityDepositStatus("withheld")).toBe("");
    expect(parseSecurityDepositStatus("held")).toBe("held");
  });

  it("maps collection amounts to recorded statuses without using held", () => {
    expect(deriveDepositStatus(0, 0)).toBe("not_required");
    expect(deriveDepositStatus(150000, 0)).toBe("required");
    expect(deriveDepositStatus(150000, 50000)).toBe("partially_collected");
    expect(deriveDepositStatus(150000, 150000)).toBe("collected");
    expect(deriveDepositStatus(150000, 150000)).not.toBe("held");
  });

  it("labels stored collection methods only", () => {
    expect(securityDepositCollectionMethodLabel("mobile_money")).toBe("Mobile money");
    expect(securityDepositCollectionMethodLabel(null)).toBe("—");
    expect(securityDepositCollectionMethodLabel("cheque")).toBe("—");
  });

  it("searches booking reference, email, and customer name", () => {
    const row = {
      reference: "NP-2608-ABCD",
      email: "ama@example.com",
      firstName: "Ama",
      lastName: "Mensah",
    };

    expect(matchesSecurityDepositSearch(row, "NP-2608")).toBe(true);
    expect(matchesSecurityDepositSearch(row, "ama@")).toBe(true);
    expect(matchesSecurityDepositSearch(row, "ama mensah")).toBe(true);
    expect(matchesSecurityDepositSearch(row, "Kwame")).toBe(false);
    expect(matchesSecurityDepositSearch(row, "  ")).toBe(true);
  });
});

describe("security deposit permissions", () => {
  it("lets finance, reservations, and fleet view the deposits console", () => {
    expect(canViewSecurityDeposits("finance")).toBe(true);
    expect(canViewSecurityDeposits("reservations")).toBe(true);
    expect(canViewSecurityDeposits("fleet")).toBe(true);
    expect(canViewSecurityDeposits("administrator")).toBe(true);
    expect(canViewSecurityDeposits("content_editor")).toBe(false);
  });

  it("lets finance and reservations settle records, not fleet", () => {
    expect(canMutateSecurityDeposit("finance")).toBe(true);
    expect(canMutateSecurityDeposit("reservations")).toBe(true);
    expect(canMutateSecurityDeposit("administrator")).toBe(true);
    expect(canMutateSecurityDeposit("fleet")).toBe(false);
    expect(canMutateSecurityDeposit("content_editor")).toBe(false);
  });
});
