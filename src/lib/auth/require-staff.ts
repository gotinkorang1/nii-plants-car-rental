import "server-only";

import { redirect } from "next/navigation";

import { UnauthorizedError } from "@/lib/auth/errors";
import { getStaffUser, type StaffUser } from "@/lib/auth/get-staff-user";

export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaffUser();

  if (!staff) {
    redirect("/admin/login");
  }

  return staff;
}

export async function requireStaffAction(): Promise<StaffUser> {
  const staff = await getStaffUser();

  if (!staff) {
    throw new UnauthorizedError();
  }

  return staff;
}
