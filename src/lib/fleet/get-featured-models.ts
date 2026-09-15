import "server-only";

import { getPublicModels } from "@/lib/fleet/get-public-models";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export async function getFeaturedModels(
  limit = 3,
): Promise<PublicVehicleModel[]> {
  return getPublicModels({}, { featuredOnly: true, limit });
}
