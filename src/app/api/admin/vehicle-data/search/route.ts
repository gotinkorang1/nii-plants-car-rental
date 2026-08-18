import { NextResponse, type NextRequest } from "next/server";

import { consumeVehicleDataSearchLimit } from "@/lib/vehicle-data/rate-limit";
import {
  authorizeVehicleDataRequest,
  rateLimitedResponse,
  vehicleDataErrorResponse,
} from "@/lib/vehicle-data/route-helpers";

export const dynamic = "force-dynamic";

export const VEHICLE_SEARCH_MIN_LENGTH = 2;
const MAX_LENGTH = 80;
/** Letters, digits, spaces and the punctuation that appears in model names. */
const ALLOWED_QUERY = /^[\p{L}\p{N} .,'&+/-]+$/u;

export async function GET(request: NextRequest) {
  const context = await authorizeVehicleDataRequest();
  if (context instanceof NextResponse) {
    return context;
  }

  const raw = request.nextUrl.searchParams.get("q") ?? "";
  const query = raw.replace(/\s+/g, " ").trim();

  if (query.length < VEHICLE_SEARCH_MIN_LENGTH || query.length > MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Type between ${VEHICLE_SEARCH_MIN_LENGTH} and ${MAX_LENGTH} characters to search.`,
        reason: "invalid_request",
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_QUERY.test(query)) {
    return NextResponse.json(
      {
        error: "Search using letters, numbers and spaces.",
        reason: "invalid_request",
      },
      { status: 400 },
    );
  }

  const limit = consumeVehicleDataSearchLimit(context.staff.id);
  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const results = await context.provider.search(query, request.signal);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return vehicleDataErrorResponse(error);
  }
}
