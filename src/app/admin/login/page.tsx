import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getStaffUser } from "@/lib/auth/get-staff-user";
import { getSafeAdminRedirect } from "@/lib/auth/paths";
import { isSupabaseConfigured } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Staff sign in",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeAdminRedirect(params.next);
  const staff = await getStaffUser();

  if (staff) {
    redirect(nextPath);
  }

  const errorMessage =
    params.error === "staff_required"
      ? "This account does not have staff access."
      : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        Nii Plants staff
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Staff dashboard access is limited to authorised Nii Plants accounts.
      </p>
      <div className="mt-8">
        <LoginForm
          nextPath={nextPath}
          configured={isSupabaseConfigured()}
          errorMessage={errorMessage}
        />
      </div>
    </main>
  );
}
