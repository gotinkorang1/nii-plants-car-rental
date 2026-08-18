import { asOptionalString } from "@/lib/env";

export type PostgresClientOptions = {
  max: number;
  prepare: boolean;
  idle_timeout: number;
};

const TRANSACTION_POOLER_PORT = "6543";
const DEFAULT_SESSION_POOL = 5;
const MAX_APP_POOL = 10;

function parseConnectionUrl(connectionString: string): URL | null {
  try {
    return new URL(connectionString);
  } catch {
    return null;
  }
}

export function isTransactionPoolerUrl(connectionString: string): boolean {
  const url = parseConnectionUrl(connectionString);
  if (!url) {
    return false;
  }

  return (
    url.port === TRANSACTION_POOLER_PORT ||
    url.hostname.includes("pooler.supabase.com")
  );
}

export function resolvePostgresClientOptions(
  connectionString: string,
  poolMaxEnv = process.env.DATABASE_POOL_MAX,
): PostgresClientOptions {
  const transactionPooler = isTransactionPoolerUrl(connectionString);
  const configured = asOptionalString(poolMaxEnv);
  const parsed = configured ? Number.parseInt(configured, 10) : Number.NaN;
  const hasExplicitMax = Number.isInteger(parsed) && parsed > 0;
  const max = hasExplicitMax
    ? Math.min(parsed, MAX_APP_POOL)
    : transactionPooler
      ? 1
      : DEFAULT_SESSION_POOL;

  return {
    max,
    prepare: !transactionPooler,
    idle_timeout: 20,
  };
}
