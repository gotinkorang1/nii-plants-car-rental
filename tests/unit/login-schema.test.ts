import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/login";

describe("login schema", () => {
  it("accepts a well-formed staff login payload", () => {
    const parsed = loginSchema.parse({
      email: "staff@example.com",
      password: "long-enough",
    });

    expect(parsed.email).toBe("staff@example.com");
  });

  it("rejects an invalid email or short password", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "long-enough" })
        .success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "staff@example.com", password: "short" })
        .success,
    ).toBe(false);
  });
});
