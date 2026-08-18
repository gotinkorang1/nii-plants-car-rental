import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requirePublicEnv } from "@/lib/env";
import { requireServerEnv } from "@/lib/env.server";

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
