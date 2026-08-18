import { describe, expect, it } from "vitest";

import {
  detectImageMimeType,
  validateFleetImageFile,
  vehicleImageMetadataSchema,
} from "@/lib/validation/vehicle-image";

describe("vehicle image metadata", () => {
  it("requires alt text and a non-negative sort order", () => {
    expect(
      vehicleImageMetadataSchema.parse({
        altText: "White sedan, front view",
        sortOrder: "2",
        isPrimary: true,
      }),
    ).toEqual({
      altText: "White sedan, front view",
      sortOrder: 2,
      isPrimary: true,
    });

    expect(
      vehicleImageMetadataSchema.safeParse({
        altText: " ",
        sortOrder: 0,
      }).success,
    ).toBe(false);
  });
});

describe("fleet image file validation", () => {
  it("accepts JPEG magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageMimeType(jpeg)).toBe("image/jpeg");
    expect(validateFleetImageFile({ size: jpeg.length, bytes: jpeg })).toBe(
      "image/jpeg",
    );
  });

  it("rejects empty, oversized, and non-image bytes", () => {
    expect(() =>
      validateFleetImageFile({ size: 0, bytes: new Uint8Array() }),
    ).toThrow(/5 MB/i);
    expect(() =>
      validateFleetImageFile({
        size: 5 * 1024 * 1024 + 1,
        bytes: new Uint8Array([0xff, 0xd8, 0xff]),
      }),
    ).toThrow(/5 MB/i);
    expect(() =>
      validateFleetImageFile({
        size: 4,
        bytes: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
      }),
    ).toThrow(/JPEG, PNG, WebP, or AVIF/i);
  });
});
