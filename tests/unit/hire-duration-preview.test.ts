import { describe, expect, it } from "vitest";

import {
  formatAccraDateLabel,
  hireDurationMessage,
  previewHireDuration,
} from "@/lib/booking/hire-duration-preview";

describe("previewHireDuration", () => {
  it("stays incomplete until both dates and times are present", () => {
    expect(
      previewHireDuration({
        pickupDate: "2026-08-20",
        pickupTime: "10:00",
      }),
    ).toEqual({ status: "incomplete" });
  });

  it("rejects an invalid clock time", () => {
    expect(
      previewHireDuration({
        pickupDate: "2026-08-20",
        pickupTime: "25:00",
        returnDate: "2026-08-21",
        returnTime: "10:00",
      }),
    ).toEqual({ status: "invalid" });
  });

  it("requires return after pickup", () => {
    expect(
      previewHireDuration({
        pickupDate: "2026-08-21",
        pickupTime: "10:00",
        returnDate: "2026-08-21",
        returnTime: "10:00",
      }),
    ).toEqual({ status: "order" });
  });

  it("uses the same 24-hour chargeable-day rule as pricing", () => {
    expect(
      previewHireDuration({
        pickupDate: "2026-08-20",
        pickupTime: "10:00",
        returnDate: "2026-08-21",
        returnTime: "10:00",
      }),
    ).toEqual({ status: "ready", days: 1 });
    expect(
      previewHireDuration({
        pickupDate: "2026-08-20",
        pickupTime: "10:00",
        returnDate: "2026-08-21",
        returnTime: "10:01",
      }),
    ).toEqual({ status: "ready", days: 2 });
  });
});

describe("hireDurationMessage", () => {
  it("explains ready hires in plain language", () => {
    expect(hireDurationMessage({ status: "ready", days: 1 })).toBe(
      "This hire is 1 chargeable day · travel inside Ghana",
    );
    expect(hireDurationMessage({ status: "ready", days: 3 })).toBe(
      "This hire is 3 chargeable days · travel inside Ghana",
    );
  });
});

describe("formatAccraDateLabel", () => {
  it("formats ISO dates without depending on the browser locale", () => {
    expect(formatAccraDateLabel("2026-08-19")).toBe("19 Aug 2026");
  });
});
