import { NextResponse, type NextRequest } from "next/server";

import { findSimilarVehicleModels } from "@/lib/fleet/find-similar-models";
import { parseProviderId } from "@/lib/vehicle-data/cardatabase";
import {
  toVehicleImportFields,
  toVehicleImportImages,
  type VehicleImportPayload,
} from "@/lib/vehicle-data/import-payload";
import { buildSuggestionLabel } from "@/lib/vehicle-data/normalize";
import { isVehicleImageImportEnabled } from "@/lib/vehicle-data/provider";
import { consumeVehicleDataFetchLimit } from "@/lib/vehicle-data/rate-limit";
import {
  authorizeVehicleDataRequest,
  rateLimitedResponse,
  vehicleDataErrorResponse,
} from "@/lib/vehicle-data/route-helpers";

export const dynamic = "force-dynamic";

/**
 * The provider reference is a two-segment path (brand/model), so the route is
 * a catch-all rather than a single opaque id.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string[] }> },
) {
  const context = await authorizeVehicleDataRequest();
  if (context instanceof NextResponse) {
    return context;
  }

  const { providerId: segments } = await params;
  const providerId = (segments ?? []).join("/").toLowerCase();

  if (!parseProviderId(providerId)) {
    return NextResponse.json(
      { error: "That vehicle reference is not valid.", reason: "invalid_request" },
      { status: 400 },
    );
  }

  const limit = consumeVehicleDataFetchLimit(context.staff.id);
  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const detail = await context.provider.getVehicle(providerId, request.signal);
    const fields = toVehicleImportFields(detail);

    const payload: VehicleImportPayload = {
      provider: context.provider.name,
      providerId,
      label: buildSuggestionLabel({
        make: fields.make,
        model: fields.model,
        year: fields.yearFrom,
        trim: fields.trimLevel,
      }),
      fields,
      images: toVehicleImportImages(detail),
      imageImportEnabled: isVehicleImageImportEnabled(),
      duplicates: await findSimilarVehicleModels({
        make: fields.make,
        model: fields.model,
        externalProvider: context.provider.name,
        externalVehicleId: providerId,
      }),
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return vehicleDataErrorResponse(error);
  }
}
