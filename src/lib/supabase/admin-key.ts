export type SupabaseAdminCredentials = {
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export function resolveSupabaseAdminKey(credentials: SupabaseAdminCredentials) {
  return credentials.SUPABASE_SECRET_KEY ?? credentials.SUPABASE_SERVICE_ROLE_KEY;
}
