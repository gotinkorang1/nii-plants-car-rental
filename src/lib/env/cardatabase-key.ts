import { asOptionalString } from "@/lib/env";

/**
 * CarDatabase keys are optional. Production historically stored the key as
 * `CAR_DATABASE_API_KEY`; the app documents `CARDATABASE_API_KEY`. Bracket
 * access avoids Next.js inlining an empty build-time value.
 */
export function readCardatabaseApiKey(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return (
    asOptionalString(env["CARDATABASE_API_KEY"]) ??
    asOptionalString(env["CAR_DATABASE_API_KEY"])
  );
}
