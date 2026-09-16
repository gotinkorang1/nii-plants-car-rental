import { asOptionalString } from "@/lib/env";

export type PostgresClientOptions = {
  max: number;
  prepare: boolean;
  idle_timeout: number;
  connect_timeout: number;
  max_lifetime: number;
  connection: {
    statement_timeout: number;
    lock_timeout: number;
  };
};

const TRANSACTION_POOLER_PORT = "6543";
const DEFAULT_POOL = 5;
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
  // Transaction-mode Supavisor cannot pipeline. postgres.js still pipelines
  // concurrent queries on one connection when max is 1, which hangs until
  // statement_timeout. Keep the same default as session URLs so Promise.all
  // on public pages can run.
  // Direct Supabase session URLs consume one limited database session per
  // live serverless instance. Keep that pool to one connection; transaction
  // pooler URLs can safely use the configured application pool.
  const max = transactionPooler
    ? hasExplicitMax
      ? Math.min(parsed, MAX_APP_POOL)
      : DEFAULT_POOL
    : 1;

  return {
    max,
    prepare: !transactionPooler,
    idle_timeout: 20,
    // Fail fast enough for Vercel to return the app's database fallback before
    // the serverless function reaches its invocation limit.
    connect_timeout: 8,
    // Recycle serverless connections before a stale pooled connection can
    // survive across invocations and keep public reads waiting indefinitely.
    max_lifetime: 300,
    // Bound database work as well as connection setup. These are startup
    // parameters, so they apply consistently to every query and transaction.
    connection: {
      statement_timeout: 8_000,
      lock_timeout: 3_000,
    },
  };
}
