import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { tryGetDb } from "@/lib/db";
import { getRuntimeEnvironment } from "@/lib/env/runtime-environment";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = getRuntimeEnvironment();
  let database: "ok" | "skipped" | "error" = "skipped";

  const db = tryGetDb();
  if (db) {
    try {
      await db.execute(sql`select 1`);
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const healthy = database !== "error";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      environment,
      checks: {
        database,
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
