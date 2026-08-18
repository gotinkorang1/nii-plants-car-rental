import { publicEnv } from "@/lib/env";

export const FLEET_MEDIA_BUCKET = "fleet-media";

export function getFleetMediaPublicUrl(storagePath: string): string | null {
  const baseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${FLEET_MEDIA_BUCKET}/${storagePath}`;
}
