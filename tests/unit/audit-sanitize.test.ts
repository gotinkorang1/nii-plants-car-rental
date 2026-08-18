import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/lib/audit/sanitize";

describe("audit metadata sanitization", () => {
  it("redacts secret-looking keys before persistence", () => {
    const sanitized = sanitizeAuditMetadata({
      action: "staff.login",
      password: "should-not-be-stored",
      accessToken: "abc",
      otp: "123456",
    });

    expect(sanitized.action).toBe("staff.login");
    expect(sanitized.password).toBe("[redacted]");
    expect(sanitized.accessToken).toBe("[redacted]");
    expect(sanitized.otp).toBe("[redacted]");
  });
});
