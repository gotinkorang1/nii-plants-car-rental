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

describe("operational kill switches", () => {
  it("fails closed in production when settings are missing", () => {
    const parsed = parseSiteSettingsRecord({}, "production");

    expect(parsed.bookingEnabled).toBe(false);
    expect(parsed.onlinePaymentEnabled).toBe(false);
  });

  it("honours explicit false in production", () => {
    const parsed = parseSiteSettingsRecord(
      { bookingEnabled: false, onlinePaymentEnabled: false },
      "production",
    );

    expect(parsed.bookingEnabled).toBe(false);
    expect(parsed.onlinePaymentEnabled).toBe(false);
  });

  it("honours booking true and payment false in production", () => {
    const parsed = parseSiteSettingsRecord(
      { bookingEnabled: true, onlinePaymentEnabled: false },
      "production",
    );

    expect(parsed.bookingEnabled).toBe(true);
    expect(parsed.onlinePaymentEnabled).toBe(false);
  });

  it("honours explicit true for both in production", () => {
    const parsed = parseSiteSettingsRecord(
      { bookingEnabled: true, onlinePaymentEnabled: true },
      "production",
    );

    expect(parsed.bookingEnabled).toBe(true);
    expect(parsed.onlinePaymentEnabled).toBe(true);
  });

  it("keeps development convenience defaults when switches are missing", () => {
    const parsed = parseSiteSettingsRecord({}, "development");

    expect(parsed.bookingEnabled).toBe(true);
    expect(parsed.onlinePaymentEnabled).toBe(true);
  });

  it("keeps preview convenience defaults when switches are missing", () => {
    const parsed = parseSiteSettingsRecord({}, "preview");

    expect(parsed.bookingEnabled).toBe(true);
    expect(parsed.onlinePaymentEnabled).toBe(true);
  });
});
