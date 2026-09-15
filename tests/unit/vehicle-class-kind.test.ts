import { describe, expect, it } from "vitest";

import { vehicleClassKind } from "@/lib/fleet/vehicle-class-kind";

describe("vehicleClassKind", () => {
  it("maps catalogue class names to silhouette kinds", () => {
    expect(vehicleClassKind("Compact sedan")).toBe("sedan");
    expect(vehicleClassKind("Luxury sedan")).toBe("sedan");
    expect(vehicleClassKind("Compact SUV")).toBe("suv");
    expect(vehicleClassKind("4x4")).toBe("offroad");
    expect(vehicleClassKind("Van")).toBe("van");
    expect(vehicleClassKind("Coach")).toBe("coach");
    expect(vehicleClassKind("Earth-moving")).toBe("other");
  });
});
