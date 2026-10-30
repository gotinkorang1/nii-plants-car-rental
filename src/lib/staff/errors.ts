type StaffSaveError = {
  code?: unknown;
  // postgres.js exposes the violated constraint as `constraint_name`; some
  // drivers/wrappers use `constraint`. Accept either.
  constraint_name?: unknown;
  constraint?: unknown;
  cause?: unknown;
};

// Pulls the Postgres SQLSTATE and constraint name out of an error. The driver
// error may be wrapped (e.g. under `cause`), so walk a short chain until a
// code or constraint is found.
function readPostgresError(error: unknown): { code: string; constraint: string } {
  const seen = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    if (seen.has(current)) {
      break;
    }
    seen.add(current);

    const details = current as StaffSaveError;
    const code = typeof details.code === "string" ? details.code : "";
    const constraint =
      typeof details.constraint_name === "string"
        ? details.constraint_name
        : typeof details.constraint === "string"
          ? details.constraint
          : "";

    if (code || constraint) {
      return { code, constraint };
    }

    current = details.cause;
  }

  return { code: "", constraint: "" };
}

export function staffProfileSaveErrorMessage(error: unknown): string {
  const { code, constraint } = readPostgresError(error);

  if (code === "23503" && constraint === "staff_profiles_auth_user_id_fkey") {
    return "The Auth user belongs to a different Supabase project. Check that NEXT_PUBLIC_SUPABASE_URL and the service key point to the same project as DATABASE_URL.";
  }

  if (code === "23505") {
    return "That email or Auth user is already on the staff list.";
  }

  if (code === "XX000") {
    return "The production database connection limit was reached. Please try again in a moment.";
  }

  return "The staff profile could not be saved. Check the production database connection and try again.";
}
