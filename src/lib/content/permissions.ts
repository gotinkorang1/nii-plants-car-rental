import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const CMS_MANAGE_ROLES = ["content_editor"] as const;

export function canManageCms(role: StaffRole): boolean {
  return hasRequiredRole(role, CMS_MANAGE_ROLES);
}
