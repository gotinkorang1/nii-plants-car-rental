import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { detectImageMimeType } from "@/lib/validation/vehicle-image";

export const INSPECTION_MEDIA_BUCKET = "inspection-media";

export const INSPECTION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const INSPECTION_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateInspectionImageFile(file: {
  size: number;
  bytes: Uint8Array;
}): string {
  if (file.size <= 0 || file.size > INSPECTION_IMAGE_MAX_BYTES) {
    throw new Error("Images must be between 1 byte and 10 MB.");
  }

  const mimeType = detectImageMimeType(file.bytes);
  if (
    !mimeType ||
    !INSPECTION_IMAGE_MIME_TYPES.includes(
      mimeType as (typeof INSPECTION_IMAGE_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Upload a JPEG, PNG, or WebP image.");
  }

  return mimeType;
}

export async function uploadInspectionPhoto(input: {
  bookingId: string;
  inspectionId: string;
  file: File;
}): Promise<{ storagePath: string; mimeType: string }> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const mimeType = validateInspectionImageFile({
    size: input.file.size,
    bytes,
  });
  const extension = extensionByMime[mimeType];
  const storagePath = `${input.bookingId}/${input.inspectionId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(INSPECTION_MEDIA_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error("The photo could not be stored. Try another file.");
  }

  return { storagePath, mimeType };
}

export async function deleteInspectionPhotoObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(INSPECTION_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error("The photo file could not be removed.");
  }
}

export async function getInspectionPhotoSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(INSPECTION_MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
