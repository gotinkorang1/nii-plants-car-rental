import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { FLEET_MEDIA_BUCKET } from "@/lib/fleet/image-url";
import { validateFleetImageFile } from "@/lib/validation/vehicle-image";

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function uploadFleetImage(input: {
  modelId: string;
  file: File;
}): Promise<{ storagePath: string; mimeType: string }> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const mimeType = validateFleetImageFile({
    size: input.file.size,
    bytes,
  });
  const extension = extensionByMime[mimeType];
  const storagePath = `${input.modelId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(FLEET_MEDIA_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error("The image could not be stored. Try another file.");
  }

  return { storagePath, mimeType };
}

export async function deleteFleetImageObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(FLEET_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error("The image file could not be removed.");
  }
}
