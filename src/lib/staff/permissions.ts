import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const STAFF_MANAGE_ROLES = ["administrator"] as const;

export function canManageStaff(role: StaffRole): boolean {
  return hasRequiredRole(role, STAFF_MANAGE_ROLES);
}
