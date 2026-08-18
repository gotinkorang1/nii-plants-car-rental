import { describe, expect, it } from "vitest";

import {
  getSafeAdminRedirect,
  isProtectedAdminPath,
  isPublicAdminPath,
} from "@/lib/auth/paths";

describe("admin path guards", () => {
  it("treats the login page as public", () => {
    expect(isPublicAdminPath("/admin/login")).toBe(true);
    expect(isProtectedAdminPath("/admin/login")).toBe(false);
  });

  it("protects the dashboard and future admin modules", () => {
    expect(isProtectedAdminPath("/admin")).toBe(true);
    expect(isProtectedAdminPath("/admin/fleet/vehicles")).toBe(true);
  });

  it("keeps post-login redirects inside the admin area", () => {
    expect(getSafeAdminRedirect("/admin")).toBe("/admin");
    expect(getSafeAdminRedirect("/admin/login")).toBe("/admin");
    expect(getSafeAdminRedirect("https://example.com")).toBe("/admin");
    expect(getSafeAdminRedirect("//evil.example")).toBe("/admin");
    expect(getSafeAdminRedirect("/book")).toBe("/admin");
    expect(getSafeAdminRedirect(undefined)).toBe("/admin");
  });
});
