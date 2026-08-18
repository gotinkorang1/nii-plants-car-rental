function normalizeAppEnv(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "development" || normalized === "preview" || normalized === "production") {
    return normalized;
  }
  return undefined;
}

export function getRuntimeEnvironment() {
  const explicit = normalizeAppEnv(process.env.APP_ENV);
  if (explicit) {
    return explicit;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production") {
    return "production";
  }
  if (vercelEnv === "preview") {
    return "preview";
  }
  if (vercelEnv === "development") {
    return "development";
  }

  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  return "development";
}

export function extractSupabaseProjectRef(databaseUrl) {
  try {
    const host = new URL(databaseUrl).hostname.toLowerCase();
    const match = host.match(/^db\.([a-z0-9-]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isBlockedProductionDatabaseTarget(databaseUrl) {
  const blockedRef = process.env.PRODUCTION_SUPABASE_PROJECT_REF?.trim().toLowerCase();
  if (!blockedRef) {
    return false;
  }
  const ref = extractSupabaseProjectRef(databaseUrl);
  return ref === blockedRef;
}

export function assertDevelopmentSeedAllowed(databaseUrl) {
  const environment = getRuntimeEnvironment();
  if (environment === "production") {
    throw new Error(
      "Refusing to run development seed: APP_ENV/VERCEL_ENV indicates production.",
    );
  }

  if (process.env.SEED_ALLOW_PRODUCTION === "1") {
    return;
  }

  if (isBlockedProductionDatabaseTarget(databaseUrl)) {
    throw new Error(
      "Refusing to run development seed: DATABASE_URL matches PRODUCTION_SUPABASE_PROJECT_REF.",
    );
  }
}
