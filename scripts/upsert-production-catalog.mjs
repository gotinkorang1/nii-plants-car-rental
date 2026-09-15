import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import postgres from "postgres";

import { getRuntimeEnvironment } from "./lib/runtime-environment.mjs";
import { upsertLocationsClassesAndModels } from "./lib/upsert-catalog.mjs";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (getRuntimeEnvironment() !== "production" && process.env.BOOTSTRAP_FORCE !== "1") {
  console.error(
    "Production catalogue upsert is intended for APP_ENV=production or VERCEL_ENV=production.",
  );
  console.error(
    "Set BOOTSTRAP_FORCE=1 only when deliberately upserting staging. Never use db:seed on production.",
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/lib/db/seed-catalog.json",
);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

async function upsert() {
  console.log(
    "Upserting production catalogue: locations, classes, and models only.",
  );
  console.log("Physical vehicles, promotions, and extras are not written.");

  await upsertLocationsClassesAndModels(sql, catalog);

  console.log(
    "Catalogue upsert complete. Register live plates in admin. Do not seed INTERNAL-UNSET units.",
  );
}

upsert()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 1 });
  });
