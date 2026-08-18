import { publicEnv } from "@/lib/env";

export const WEBSITE_MEDIA_BUCKET = "website-media";

export function getWebsiteMediaPublicUrl(storagePath: string): string | null {
  const baseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${WEBSITE_MEDIA_BUCKET}/${storagePath}`;
}
