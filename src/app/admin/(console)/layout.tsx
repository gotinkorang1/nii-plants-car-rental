import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/require-staff";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();

  return (
    <AdminShell
      staff={{
        displayName: staff.displayName,
        email: staff.email,
        role: staff.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
