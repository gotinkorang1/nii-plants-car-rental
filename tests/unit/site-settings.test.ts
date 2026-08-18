import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_SETTINGS,
  parseSiteSettingsRecord,
  siteSettingsSchema,
} from "@/lib/settings/schema";

describe("site settings", () => {
  it("accepts default Nii Plants settings", () => {
    const parsed = siteSettingsSchema.parse(DEFAULT_SITE_SETTINGS);

    expect(parsed.businessName).toBe("Nii Plants Car Rentals");
    expect(parsed.reservationPaymentPercent).toBe(25);
    expect(parsed.holdDurationMinutes).toBe(10);
    expect(parsed.quoteDurationMinutes).toBe(15);
    expect(parsed.currency).toBe("GHS");
    expect(parsed.phone.length).toBeGreaterThan(0);
  });

  it("rejects a reservation percentage outside 1-100", () => {
    expect(() =>
      siteSettingsSchema.parse({
        ...DEFAULT_SITE_SETTINGS,
        reservationPaymentPercent: 0,
      }),
    ).toThrow();
  });

  it("fills missing keys from defaults", () => {
    const parsed = parseSiteSettingsRecord({
      businessName: "Nii Plants Car Rentals",
    });

    expect(parsed.minimumRentalHours).toBe(24);
    expect(parsed.quoteDurationMinutes).toBe(15);
    expect(parsed.currency).toBe("GHS");
  });
});
