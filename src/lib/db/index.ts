import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { requireServerEnv, serverEnv } from "@/lib/env.server";

import { resolvePostgresClientOptions } from "./postgres-options";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

export type AppDatabase = Database;
export type AppTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

let client: ReturnType<typeof postgres> | undefined;
let db: Database | undefined;

export function getDb() {
  if (db) {
    return db;
  }

  const connectionString = requireServerEnv("DATABASE_URL");
  client = postgres(
    connectionString,
    resolvePostgresClientOptions(connectionString),
  );
  db = drizzle({ client, schema });

  return db;
}

export function createPostgresClient(options?: { max?: number }) {
  const connectionString = requireServerEnv("DATABASE_URL");
  const resolved = resolvePostgresClientOptions(connectionString);
  return postgres(connectionString, {
    ...resolved,
    max: options?.max ?? resolved.max,
  });
}

export function tryGetDb() {
  if (!serverEnv.DATABASE_URL) {
    return null;
  }

  return getDb();
}
