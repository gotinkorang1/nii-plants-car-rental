import "server-only";

import { redirect } from "next/navigation";

import { ForbiddenError } from "@/lib/auth/errors";
import { getStaffUser, type StaffUser } from "@/lib/auth/get-staff-user";
import { hasRequiredRole, type StaffRole } from "@/lib/auth/roles";
import { requireStaff, requireStaffAction } from "@/lib/auth/require-staff";

export async function requireRole(
  allowed: StaffRole | readonly StaffRole[],
): Promise<StaffUser> {
  const staff = await requireStaff();

  if (!hasRequiredRole(staff.role, allowed)) {
    redirect("/admin");
  }

  return staff;
}

export async function requireRoleAction(
  allowed: StaffRole | readonly StaffRole[],
): Promise<StaffUser> {
  const staff = await requireStaffAction();

  if (!hasRequiredRole(staff.role, allowed)) {
    throw new ForbiddenError();
  }

  return staff;
}

export async function staffHasRole(
  allowed: StaffRole | readonly StaffRole[],
): Promise<boolean> {
  const staff = await getStaffUser();
  return Boolean(staff && hasRequiredRole(staff.role, allowed));
}
