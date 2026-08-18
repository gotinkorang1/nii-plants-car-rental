import "server-only";

import { log } from "@/lib/logger";
import { tryGetDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { getRuntimeEnvironment } from "@/lib/env/runtime-environment";
import { parseSiteSettingsRecord, type SiteSettings } from "@/lib/settings/schema";

function settingsForCurrentEnvironment(record: Record<string, unknown> = {}) {
  return parseSiteSettingsRecord(record, getRuntimeEnvironment());
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = tryGetDb();
  if (!db) {
    return settingsForCurrentEnvironment();
  }

  try {
    const rows = await db
      .select({
        key: siteSettings.key,
        value: siteSettings.value,
      })
      .from(siteSettings);

    const record: Record<string, unknown> = {};
    for (const row of rows) {
      record[row.key] = row.value;
    }

    return settingsForCurrentEnvironment(record);
  } catch (error) {
    log("error", "Failed to load site settings.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return settingsForCurrentEnvironment();
  }
}
