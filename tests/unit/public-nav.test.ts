import { describe, expect, it } from "vitest";

import {
  isPublicNavCurrent,
  shouldHidePublicActionBar,
} from "@/lib/content/public-nav";

describe("isPublicNavCurrent", () => {
  it("treats nested service routes as current", () => {
    expect(isPublicNavCurrent("/services/chauffeur", "/services")).toBe(true);
    expect(isPublicNavCurrent("/fleet", "/services")).toBe(false);
  });

  it("does not treat the homepage as a prefix match", () => {
    expect(isPublicNavCurrent("/", "/")).toBe(true);
    expect(isPublicNavCurrent("/fleet", "/")).toBe(false);
  });
});

describe("shouldHidePublicActionBar", () => {
  it("hides the bar on booking and payment routes", () => {
    expect(shouldHidePublicActionBar("/book")).toBe(true);
    expect(shouldHidePublicActionBar("/booking/NP-1")).toBe(true);
    expect(shouldHidePublicActionBar("/payment/callback")).toBe(true);
    expect(shouldHidePublicActionBar("/")).toBe(false);
    expect(shouldHidePublicActionBar("/fleet")).toBe(false);
  });
});
