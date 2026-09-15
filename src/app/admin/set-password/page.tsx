import type { Metadata } from "next";

import { SetStaffPasswordForm } from "@/components/admin/set-staff-password-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Set staff password",
};

export const dynamic = "force-dynamic";

export default function SetStaffPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        Nii Plants staff
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Choose a password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Finish your staff invite by choosing a password, then continue to the
        dashboard.
      </p>
      <div className="mt-8">
        <SetStaffPasswordForm configured={isSupabaseConfigured()} />
      </div>
    </main>
  );
}
