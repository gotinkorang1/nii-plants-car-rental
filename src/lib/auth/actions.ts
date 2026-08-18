"use server";

import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getStaffUser } from "@/lib/auth/get-staff-user";
import { getSafeAdminRedirect } from "@/lib/auth/paths";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/login";

export type LoginState = {
  error: string;
} | null;

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Staff login is not configured. Add the public Supabase environment variables first.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid login details.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const staff = await getStaffUser();

  if (!staff) {
    await supabase.auth.signOut();
    return {
      error: "This account does not have active staff access.",
    };
  }

  await writeAuditLog({
    actorType: "staff",
    actorId: staff.id,
    action: "staff.login",
    entityType: "staff_profile",
    entityId: staff.id,
  });

  redirect(getSafeAdminRedirect(formData.get("next")));
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login");
  }

  const staff = await getStaffUser();
  const supabase = await createClient();
  await supabase.auth.signOut();

  if (staff) {
    await writeAuditLog({
      actorType: "staff",
      actorId: staff.id,
      action: "staff.logout",
      entityType: "staff_profile",
      entityId: staff.id,
    });
  }

  redirect("/admin/login");
}
