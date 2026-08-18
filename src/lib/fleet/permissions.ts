import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const FLEET_MANAGE_ROLES = ["fleet"] as const;
export const FLEET_CONTENT_ROLES = ["fleet", "content_editor"] as const;

export function canManageFleet(role: StaffRole): boolean {
  return hasRequiredRole(role, FLEET_MANAGE_ROLES);
}

export function canEditFleetContent(role: StaffRole): boolean {
  return hasRequiredRole(role, FLEET_CONTENT_ROLES);
}
