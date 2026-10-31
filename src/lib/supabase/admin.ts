import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, requirePublicEnv } from "@/lib/env";
import { requireServerEnv, serverEnv } from "@/lib/env.server";
import { resolveSupabaseAdminKey } from "@/lib/supabase/admin-key";

export function createAdminClient() {
  const adminKey = resolveSupabaseAdminKey(serverEnv);
  return createSupabaseClient(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    adminKey ?? requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function tryCreateAdminClient() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !resolveSupabaseAdminKey(serverEnv)) {
    return null;
  }

  return createAdminClient();
}
