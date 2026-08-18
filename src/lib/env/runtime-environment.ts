import "server-only";

export type RuntimeEnvironment = "development" | "preview" | "production";

const VALID_APP_ENV = new Set<RuntimeEnvironment>([
  "development",
  "preview",
  "production",
]);

function normalizeAppEnv(value: unknown): RuntimeEnvironment | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase() as RuntimeEnvironment;
  return VALID_APP_ENV.has(normalized) ? normalized : undefined;
}

/**
 * Resolve the application environment without relying on NODE_ENV alone.
 * Hosted Next.js preview builds also use NODE_ENV=production.
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
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

  // Local `next build && next start`, CI production builds, and Lighthouse
  // runs use NODE_ENV=production but are not the live production deployment.
  return "development";
}

export function isDevelopmentRuntime(): boolean {
  return getRuntimeEnvironment() === "development";
}

export function isPreviewRuntime(): boolean {
  return getRuntimeEnvironment() === "preview";
}

export function isProductionRuntime(): boolean {
  return getRuntimeEnvironment() === "production";
}

export function shouldNoIndexPublicSite(): boolean {
  return isPreviewRuntime();
}
