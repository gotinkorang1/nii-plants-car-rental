#!/usr/bin/env node
/**
 * Fresh disposable Supabase migration verification.
 * Uses a separate local Supabase project (ports 554xx) — never 54422 dev DB.
 */
import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workdir = join(root, ".fresh-supabase-verify");
const configPath = join(workdir, "supabase", "config.toml");
const journalPath = join(root, "drizzle", "meta", "_journal.json");
const FRESH_DB_PORT = "55422";

function log(message) {
  console.log(`[fresh-migration] ${message}`);
}

function run(command, options = {}) {
  log(`$ ${command}`);
  return execSync(command, {
    cwd: options.cwd ?? root,
    stdio: "inherit",
    env: { ...process.env, ...options.env },
  });
}

function runCapture(command, options = {}) {
  return execSync(command, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
  }).trim();
}

function prepareWorkdir() {
  mkdirSync(join(workdir, "supabase"), { recursive: true });
  let config = readFileSync(join(root, "supabase", "config.toml"), "utf8");
  config = config
    .replaceAll("nii-plants-car-rental", "nii-plants-fresh-verify")
    .replaceAll("54429", "55429")
    .replaceAll("54427", "55427")
    .replaceAll("54424", "55424")
    .replaceAll("54423", "55423")
    .replaceAll("54422", "55422")
    .replaceAll("54421", "55421")
    .replaceAll("54420", "55420");
  writeFileSync(configPath, config);
}

function parseSupabaseStatusJson() {
  const raw = runCapture(`supabase status --workdir "${workdir}" --output json`);
  return JSON.parse(raw);
}

async function applyMigrationsManually(databaseUrl) {
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    for (const entry of journal.entries) {
      const filePath = join(root, "drizzle", `${entry.tag}.sql`);
      const content = readFileSync(filePath, "utf8");
      const statements = content
        .split("--> statement-breakpoint")
        .map((part) => part.trim())
        .filter(Boolean);
      log(`Applying ${entry.tag} (${statements.length} statements)`);
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function applyMigrations(databaseUrl) {
  try {
    run(`npm run db:migrate`, { env: { DATABASE_URL: databaseUrl } });
    const sql = postgres(databaseUrl, { max: 1 });
    const countRows = await sql`
      SELECT count(*)::text AS count
      FROM information_schema.tables
      WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
    `;
    await sql.end({ timeout: 5 });
    if (Number(countRows[0]?.count ?? 0) > 0) {
      return "drizzle-kit migrate";
    }
  } catch {
    log("drizzle-kit migrate failed; applying SQL manually.");
  }
  await applyMigrationsManually(databaseUrl);
  return "manual SQL apply";
}

async function verifySchema(databaseUrl) {
  const sql = postgres(databaseUrl, { max: 1 });
  const report = {
    migrationHistory: { ok: false, count: 0, method: "" },
    btreeGist: false,
    createVehicleHold: false,
    exclusionConstraint: false,
    tables: {},
    enums: {},
    indexes: {},
    rls: {},
    storage: {},
  };

  try {
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    const migrationTables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = '__drizzle_migrations'
    `;
    if (migrationTables.length > 0) {
      const schema = migrationTables[0].table_schema;
      const rows = await sql.unsafe(
        `SELECT id, hash, created_at FROM "${schema}"."__drizzle_migrations" ORDER BY created_at`,
      );
      report.migrationHistory.count = rows.length;
      report.migrationHistory.ok = rows.length === journal.entries.length;
    } else {
      report.migrationHistory.count = journal.entries.length;
      report.migrationHistory.ok = true;
      report.migrationHistory.method = "journal-only (manual apply)";
    }

    const [gist] = await sql`
      SELECT 1 AS ok FROM pg_extension WHERE extname = 'btree_gist'
    `;
    report.btreeGist = Boolean(gist);

    const [holdFn] = await sql`
      SELECT 1 AS ok
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'create_vehicle_hold'
    `;
    report.createVehicleHold = Boolean(holdFn);

    const [exclusion] = await sql`
      SELECT 1 AS ok
      FROM pg_constraint
      WHERE conname = 'vehicle_allocations_no_overlap_excl'
    `;
    report.exclusionConstraint = Boolean(exclusion);

    const requiredTables = [
      "bookings",
      "payments",
      "quotes",
      "vehicle_allocations",
      "rental_inspections",
      "inspection_photos",
      "security_deposits",
      "maintenance_records",
      "enquiries",
      "enquiry_status_history",
    ];
    for (const table of requiredTables) {
      const [row] = await sql`
        SELECT 1 AS ok
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ${table}
      `;
      report.tables[table] = Boolean(row);
    }

    const requiredEnums = [
      "enquiry_service_type",
      "enquiry_status",
      "enquiry_source",
      "booking_status",
      "payment_status",
    ];
    for (const enumName of requiredEnums) {
      const [row] = await sql`
        SELECT 1 AS ok
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = ${enumName}
      `;
      report.enums[enumName] = Boolean(row);
    }

    const requiredIndexes = [
      "vehicle_allocations_vehicle_status_range_idx",
      "enquiries_reference_uidx",
      "bookings_reference_uidx",
    ];
    for (const indexName of requiredIndexes) {
      const [row] = await sql`
        SELECT 1 AS ok FROM pg_indexes WHERE indexname = ${indexName}
      `;
      report.indexes[indexName] = Boolean(row);
    }

    const rlsTables = [
      "bookings",
      "payments",
      "customers",
      "enquiries",
      "audit_logs",
    ];
    for (const table of rlsTables) {
      const [row] = await sql`
        SELECT c.relrowsecurity AS enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = ${table}
      `;
      report.rls[table] = Boolean(row?.enabled);
    }

    const buckets = await sql`
      SELECT id, public
      FROM storage.buckets
      WHERE id IN ('fleet-media', 'inspection-media')
      ORDER BY id
    `;
    report.storage.fleetMedia = buckets.some((b) => b.id === "fleet-media" && b.public);
    report.storage.inspectionMedia = buckets.some(
      (b) => b.id === "inspection-media" && !b.public,
    );

    const [fleetPolicy] = await sql`
      SELECT 1 AS ok
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'fleet_media_public_read'
    `;
    report.storage.fleetPublicReadPolicy = Boolean(fleetPolicy);
  } finally {
    await sql.end({ timeout: 5 });
  }

  return report;
}

function printReport(report, migrationMethod, testResults) {
  console.log("\n=== FRESH MIGRATION VERIFICATION REPORT ===\n");
  console.log(`fresh database: postgresql://postgres:***@127.0.0.1:${FRESH_DB_PORT}/postgres`);
  console.log(`migrations applied: ${migrationMethod}`);
  console.log(`migration count: ${report.migrationHistory.count}`);
  console.log(
    `migration failures: ${
      report.migrationHistory.ok &&
      report.btreeGist &&
      report.createVehicleHold &&
      report.exclusionConstraint
        ? "none"
        : "see schema verification"
    }`,
  );
  console.log(
    `RLS verification: ${Object.entries(report.rls)
      .map(([k, v]) => `${k}=${v ? "enabled" : "missing"}`)
      .join(", ")}`,
  );
  console.log(
    `storage verification: fleet-media public=${report.storage.fleetMedia}, inspection-media private=${report.storage.inspectionMedia}, fleet read policy=${report.storage.fleetPublicReadPolicy}`,
  );
  for (const [name, result] of Object.entries(testResults)) {
    console.log(`${name}: ${result}`);
  }
}

async function runIntegrationSuites(env) {
  const suites = [
    ["Phase 4 concurrency", "tests/integration/vehicle-holds.test.ts"],
    ["Phase 5 booking tests", "tests/integration/phase5-bookings.test.ts"],
    ["Phase 6 payment tests", "tests/integration/phase6-payments.test.ts"],
    ["Phase 7 operations", "tests/integration/phase7-operations.test.ts"],
    ["Phase 8 enquiries", "tests/integration/phase8-enquiries.test.ts"],
  ];
  const results = {};
  for (const [label, file] of suites) {
    const outcome = spawnSync(
      `npx vitest run --project unit ${file}`,
      {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, ...env },
        shell: true,
      },
    );
    results[label] = outcome.status === 0 ? "PASS" : "FAIL";
  }
  return results;
}

async function main() {
  if (!existsSync(join(root, "node_modules"))) {
    throw new Error("Run npm install first.");
  }

  prepareWorkdir();
  log("Starting disposable Supabase (ports 554xx)...");
  run(`supabase start --workdir "${workdir}" --yes`);

  try {
    let status;
    try {
      status = parseSupabaseStatusJson();
    } catch (error) {
      throw new Error(`Failed to read fresh Supabase status: ${error}`);
    }

    const databaseUrl = status.DB_URL;
    if (!databaseUrl.includes(`:${FRESH_DB_PORT}/`)) {
      throw new Error(`Fresh DB is not on port ${FRESH_DB_PORT}: ${databaseUrl}`);
    }

    const migrationMethod = await applyMigrations(databaseUrl);
    const report = await verifySchema(databaseUrl);
    report.migrationHistory.method = migrationMethod;

    log("Seeding development catalogue for integration tests...");
    const testEnv = {
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
      PAYSTACK_MOCK: "1",
      EMAIL_DEV_OUTBOX: "1",
      BOOKING_OTP_SECRET: "fresh-migration-test-otp-secret",
    };
    run(`node scripts/seed.mjs`, { env: testEnv });

    const testResults = await runIntegrationSuites(testEnv);
    printReport(report, migrationMethod, testResults);

    const failedTests = Object.values(testResults).some((value) => value === "FAIL");
    const schemaOk =
      report.btreeGist &&
      report.createVehicleHold &&
      report.exclusionConstraint &&
      Object.values(report.tables).every(Boolean) &&
      Object.values(report.enums).every(Boolean) &&
      Object.values(report.rls).every(Boolean) &&
      report.storage.fleetMedia &&
      report.storage.inspectionMedia;

    if (!schemaOk || failedTests) {
      process.exitCode = 1;
    }
  } finally {
    log("Stopping disposable Supabase...");
    try {
      run(`supabase stop --workdir "${workdir}" --no-backup --yes`);
    } catch {
      log("Warning: failed to stop disposable Supabase cleanly.");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
