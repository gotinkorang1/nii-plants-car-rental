import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { expireUnpaidBookings } from "@/lib/bookings/expire-unpaid-bookings";
import { serverEnv } from "@/lib/env.server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

function authorizeCron(request: NextRequest): boolean {
  const configured = serverEnv.CRON_SECRET;
  if (!configured) {
    return false;
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (!provided) {
    return false;
  }

  const left = Buffer.from(provided);
  const right = Buffer.from(configured);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    log("warn", "cron_cleanup_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiredBookings = await expireUnpaidBookings();

  log("info", "cron_cleanup_completed", { expiredBookings });

  return NextResponse.json({
    ok: true,
    expiredBookings,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
