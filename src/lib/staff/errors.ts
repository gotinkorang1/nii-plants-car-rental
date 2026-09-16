type StaffSaveError = {
  code?: unknown;
  constraint?: unknown;
  message?: unknown;
};

export function staffProfileSaveErrorMessage(error: unknown): string {
  const details = (error && typeof error === "object" ? error : {}) as StaffSaveError;
  const constraint = typeof details.constraint === "string" ? details.constraint : "";
  const code = typeof details.code === "string" ? details.code : "";

  if (code === "23503" && constraint === "staff_profiles_auth_user_id_fkey") {
    return "The Auth user belongs to a different Supabase project. Check the production Supabase credentials.";
  }

  if (code === "23505") {
    return "That email or Auth user is already on the staff list.";
  }

  if (code === "XX000") {
    return "The production database connection limit was reached. Please try again in a moment.";
  }

  return "The staff profile could not be saved. Check the production database connection and try again.";
}
