import { describe, expect, it } from "vitest";

import {
  CUSTOM_FIELDS_MAX,
  publicCustomFields,
  vehicleCustomFieldsJsonSchema,
  vehicleCustomFieldsSchema,
} from "@/lib/validation/vehicle-custom-fields";

describe("custom specification validation", () => {
  it("trims entries and defaults them to private", () => {
    const parsed = vehicleCustomFieldsSchema.parse([
      { label: "  Ground clearance ", value: " 170 mm " },
    ]);

    expect(parsed).toEqual([
      { label: "Ground clearance", value: "170 mm", showPublicly: false },
    ]);
  });

  it("preserves the order staff entered", () => {
    const parsed = vehicleCustomFieldsSchema.parse([
      { label: "Boot space", value: "470 L", showPublicly: true },
      { label: "Ground clearance", value: "170 mm", showPublicly: false },
      { label: "Roof rails", value: "Yes", showPublicly: true },
    ]);

    expect(parsed.map((field) => field.label)).toEqual([
      "Boot space",
      "Ground clearance",
      "Roof rails",
    ]);
  });

  it("rejects blank labels, blank values and over-long text", () => {
    expect(
      vehicleCustomFieldsSchema.safeParse([{ label: "  ", value: "170 mm" }])
        .success,
    ).toBe(false);
    expect(
      vehicleCustomFieldsSchema.safeParse([{ label: "Clearance", value: "" }])
        .success,
    ).toBe(false);
    expect(
      vehicleCustomFieldsSchema.safeParse([
        { label: "x".repeat(61), value: "170 mm" },
      ]).success,
    ).toBe(false);
    expect(
      vehicleCustomFieldsSchema.safeParse([
        { label: "Clearance", value: "x".repeat(201) },
      ]).success,
    ).toBe(false);
  });

  it("rejects duplicate labels regardless of case", () => {
    const parsed = vehicleCustomFieldsSchema.safeParse([
      { label: "Ground clearance", value: "170 mm" },
      { label: "ground CLEARANCE", value: "180 mm" },
    ]);

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toMatch(/used more than once/i);
  });

  it("caps the number of rows", () => {
    const tooMany = Array.from({ length: CUSTOM_FIELDS_MAX + 1 }, (_, index) => ({
      label: `Field ${index}`,
      value: "value",
    }));

    expect(vehicleCustomFieldsSchema.safeParse(tooMany).success).toBe(false);
  });
});

describe("custom specification form payload", () => {
  it("treats an empty payload as no custom fields", () => {
    expect(vehicleCustomFieldsJsonSchema.parse("")).toEqual([]);
    expect(vehicleCustomFieldsJsonSchema.parse(undefined)).toEqual([]);
  });

  it("parses the serialized editor value", () => {
    expect(
      vehicleCustomFieldsJsonSchema.parse(
        JSON.stringify([
          { label: "Boot space", value: "470 L", showPublicly: true },
        ]),
      ),
    ).toEqual([{ label: "Boot space", value: "470 L", showPublicly: true }]);
  });

  it("reports unreadable payloads instead of throwing", () => {
    const parsed = vehicleCustomFieldsJsonSchema.safeParse("{not json");

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toMatch(/could not be read/i);
  });
});

describe("public custom specifications", () => {
  it("returns only rows explicitly marked public", () => {
    expect(
      publicCustomFields([
        { label: "Boot space", value: "470 L", showPublicly: true },
        { label: "Internal fleet code", value: "NP-77", showPublicly: false },
      ]),
    ).toEqual([{ label: "Boot space", value: "470 L", showPublicly: true }]);
  });

  it("tolerates a missing or malformed column value", () => {
    expect(publicCustomFields(null)).toEqual([]);
    expect(publicCustomFields(undefined)).toEqual([]);
  });
});
