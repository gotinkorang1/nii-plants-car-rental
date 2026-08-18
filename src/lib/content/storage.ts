import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { WEBSITE_MEDIA_BUCKET } from "@/lib/content/media-url";
import { validateFleetImageFile } from "@/lib/validation/vehicle-image";

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function uploadWebsiteImage(file: File): Promise<{
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = validateFleetImageFile({
    size: file.size,
    bytes,
  });
  const extension = extensionByMime[mimeType];
  const storagePath = `${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(WEBSITE_MEDIA_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error("The image could not be stored. Try another file.");
  }

  return { storagePath, mimeType, sizeBytes: file.size };
}

export async function deleteWebsiteImageObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(WEBSITE_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error("The image file could not be removed.");
  }
}
