import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";

export type StaffUser = {
  id: string;
  authUserId: string;
  displayName: string;
  email: string;
  role: StaffRole;
};

type StaffProfileRow = {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  role: string;
  active: boolean;
};

export async function getStaffUser(): Promise<StaffUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, auth_user_id, display_name, email, role, active")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = data as StaffProfileRow;

  if (!profile.active || !isStaffRole(profile.role)) {
    return null;
  }

  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    displayName: profile.display_name,
    email: profile.email,
    role: profile.role,
  };
}
