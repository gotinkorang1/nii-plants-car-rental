import { z } from "zod";

export const FLEET_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const FLEET_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const vehicleImageMetadataSchema = z.object({
  altText: z.string().trim().min(1, "Alt text is required.").max(160),
  sortOrder: z.coerce.number().int().min(0).max(100).default(0),
  isPrimary: z.boolean().default(false),
});

export type VehicleImageMetadata = z.output<typeof vehicleImageMetadataSchema>;

export function detectImageMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    bytes[11] === 0x66
  ) {
    return "image/avif";
  }

  return null;
}

export function validateFleetImageFile(file: {
  size: number;
  bytes: Uint8Array;
}): string {
  if (file.size <= 0 || file.size > FLEET_IMAGE_MAX_BYTES) {
    throw new Error("Images must be between 1 byte and 5 MB.");
  }

  const mimeType = detectImageMimeType(file.bytes);
  if (!mimeType || !FLEET_IMAGE_MIME_TYPES.includes(mimeType as (typeof FLEET_IMAGE_MIME_TYPES)[number])) {
    throw new Error("Upload a JPEG, PNG, WebP, or AVIF image.");
  }

  return mimeType;
}
