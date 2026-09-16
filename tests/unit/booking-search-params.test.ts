import { describe, expect, it } from "vitest";

import { bookingSearchQuery } from "@/lib/booking/search-params";

const search = {
  pickupLocation: "alisa-hotel-ridge",
  returnLocation: "alisa-hotel-ridge",
  pickupDate: "2026-09-17",
  pickupTime: "10:00",
  returnDate: "2026-09-19",
  returnTime: "10:00",
  vehicle: "mitsubishi-pajero",
};

describe("bookingSearchQuery", () => {
  it("can omit a stale vehicle selection when the vehicle is in the path", () => {
    const params = new URLSearchParams(
      bookingSearchQuery(search, { includeVehicle: false }),
    );

    expect(params.get("vehicle")).toBeNull();
    expect(params.get("pickup")).toBe("alisa-hotel-ridge");
    expect(params.get("returnDate")).toBe("2026-09-19");
  });

  it("preserves vehicle selection for generic booking links", () => {
    expect(new URLSearchParams(bookingSearchQuery(search)).get("vehicle")).toBe(
      "mitsubishi-pajero",
    );
  });
});
