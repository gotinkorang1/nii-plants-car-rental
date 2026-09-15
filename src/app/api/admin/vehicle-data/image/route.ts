import { NextResponse, type NextRequest } from "next/server";

import { detectImageMimeType } from "@/lib/validation/vehicle-image";
import { parseProviderId } from "@/lib/vehicle-data/cardatabase";
import { consumeVehicleDataImportLimit } from "@/lib/vehicle-data/rate-limit";
import {
  authorizeVehicleDataRequest,
  rateLimitedResponse,
  vehicleDataErrorResponse,
} from "@/lib/vehicle-data/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Admin-only preview proxy.
 *
 * Provider image URLs need the server-side API key, so the browser cannot load
 * them directly. This streams the bytes back for the import gallery only; it
 * never runs for public fleet pages, which always serve stored copies.
 */
export async function GET(request: NextRequest) {
  const context = await authorizeVehicleDataRequest();
  if (context instanceof NextResponse) {
    return context;
  }

  const providerId = (
    request.nextUrl.searchParams.get("vehicle") ?? ""
  ).toLowerCase();
  const providerImageId = (
    request.nextUrl.searchParams.get("image") ?? ""
  ).toLowerCase();

  if (!parseProviderId(providerId) || !providerImageId) {
    return NextResponse.json(
      { error: "That image reference is not valid.", reason: "invalid_request" },
      { status: 400 },
    );
  }

  const limit = consumeVehicleDataImportLimit(context.staff.id);
  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const image = await context.provider.downloadImage(
      providerId,
      providerImageId,
      request.signal,
    );

    // Trust the bytes, not the provider's declared content type.
    const mimeType = detectImageMimeType(image.bytes);
    if (!mimeType) {
      return NextResponse.json(
        { error: "That image could not be read.", reason: "invalid_request" },
        { status: 415 },
      );
    }

    return new NextResponse(image.bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(image.bytes.byteLength),
        "Cache-Control": "private, max-age=600",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return vehicleDataErrorResponse(error);
  }
}
