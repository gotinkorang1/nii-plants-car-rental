import { notFound } from "next/navigation";

import { StaffProfileForm } from "@/components/admin/staff/staff-profile-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { STAFF_ROLE_LABELS } from "@/lib/auth/roles";
import {
  resendStaffInviteAction,
  updateStaffAction,
} from "@/lib/staff/admin-actions";
import { STAFF_MANAGE_ROLES } from "@/lib/staff/permissions";
import { getStaffProfileAdmin } from "@/lib/staff/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStaffPage({ params }: PageProps) {
  await requireRole(STAFF_MANAGE_ROLES);
  const { id } = await params;
  const person = await getStaffProfileAdmin(id);
  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={person.displayName}
        description={`${STAFF_ROLE_LABELS[person.role]} · ${person.email}`}
      />
      <StaffProfileForm
        action={updateStaffAction.bind(null, id)}
        resendAction={resendStaffInviteAction.bind(null, id)}
        defaults={person}
      />
    </div>
  );
}
