import { describe, expect, it } from "vitest";

import {
  locationOptionLabel,
  locationTypeLabel,
} from "@/lib/content/location-type";

describe("location type labels", () => {
  it("uses customer-facing names in pickup selects", () => {
    expect(locationTypeLabel("airport")).toBe("Airport");
    expect(locationTypeLabel("branch")).toBe("Office");
    expect(locationTypeLabel("pickup_point")).toBe("Hotel desk");
    expect(locationOptionLabel("Kotoka International Airport", "airport")).toBe(
      "Kotoka International Airport · Airport",
    );
    expect(locationOptionLabel("Plantsville")).toBe("Plantsville");
  });
});
