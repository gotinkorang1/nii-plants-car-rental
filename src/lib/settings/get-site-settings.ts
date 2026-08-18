import "server-only";

import { log } from "@/lib/logger";
import { tryGetDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import {
  DEFAULT_SITE_SETTINGS,
  parseSiteSettingsRecord,
  type SiteSettings,
} from "@/lib/settings/schema";

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = tryGetDb();
  if (!db) {
    return DEFAULT_SITE_SETTINGS;
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

    return parseSiteSettingsRecord(record);
  } catch (error) {
    log("error", "Failed to load site settings.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return DEFAULT_SITE_SETTINGS;
  }
}
