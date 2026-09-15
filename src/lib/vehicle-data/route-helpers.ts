import "server-only";

import { NextResponse } from "next/server";

import { getStaffUser, type StaffUser } from "@/lib/auth/get-staff-user";
import { hasRequiredRole } from "@/lib/auth/roles";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";
import { log } from "@/lib/logger";

import { providerMessage } from "./cardatabase";
import { getVehicleDataProvider } from "./provider";
import { VehicleDataError, type VehicleDataProvider } from "./types";

export type VehicleDataRouteContext = {
  staff: StaffUser;
  provider: VehicleDataProvider;
};

const STATUS_BY_REASON = {
  not_configured: 503,
  invalid_request: 400,
  not_found: 404,
  rate_limited: 429,
  unavailable: 502,
} as const;

function errorResponse(status: number, reason: string, message: string) {
  return NextResponse.json({ error: message, reason }, { status });
}

/**
 * Staff-only gate for the provider endpoints.
 *
 * Returns a response to send when the caller is not permitted or the provider
 * is unconfigured; otherwise returns the staff user and provider. Anonymous
 * visitors must never be able to proxy provider queries through Nii Plants.
 */
export async function authorizeVehicleDataRequest(): Promise<
  VehicleDataRouteContext | NextResponse
> {
  const staff = await getStaffUser();

  if (!staff) {
    return errorResponse(401, "unauthenticated", "Sign in to use vehicle lookup.");
  }

  if (!hasRequiredRole(staff.role, FLEET_MANAGE_ROLES)) {
    return errorResponse(
      403,
      "forbidden",
      "Your role cannot use the vehicle database lookup.",
    );
  }

  const provider = getVehicleDataProvider();
  if (!provider) {
    return errorResponse(
      503,
      "not_configured",
      providerMessage("not_configured"),
    );
  }

  return { staff, provider };
}

export function rateLimitedResponse(resetAt: number) {
  log("warn", "vehicle_data_rate_limit", { source: "nii_plants_endpoint" });

  return NextResponse.json(
    {
      error:
        "Too many vehicle lookups. Wait a few seconds, or enter the vehicle manually.",
      reason: "rate_limited",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
      },
    },
  );
}

/** Maps a provider failure onto an HTTP response without leaking internals. */
export function vehicleDataErrorResponse(error: unknown): NextResponse {
  if (error instanceof VehicleDataError) {
    return errorResponse(
      STATUS_BY_REASON[error.reason],
      error.reason,
      error.message,
    );
  }

  log("error", "vehicle_data_failure", {
    source: "nii_plants_endpoint",
    cause: error instanceof Error ? error.name : "unknown",
  });

  return errorResponse(502, "unavailable", providerMessage("unavailable"));
}
