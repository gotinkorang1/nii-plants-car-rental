import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, requirePublicEnv } from "@/lib/env";
import { requireServerEnv, serverEnv } from "@/lib/env.server";

export function createAdminClient() {
  return createSupabaseClient(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function tryCreateAdminClient() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createAdminClient();
}
