import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const AVAILABILITY_VIEW_ROLES = ["reservations", "fleet"] as const;
export const AVAILABILITY_MANAGE_ROLES = ["reservations", "fleet"] as const;
export const RATES_MANAGE_ROLES = ["fleet", "finance"] as const;

export function canViewAvailability(role: StaffRole): boolean {
  return hasRequiredRole(role, AVAILABILITY_VIEW_ROLES);
}

export function canManageAvailability(role: StaffRole): boolean {
  return hasRequiredRole(role, AVAILABILITY_MANAGE_ROLES);
}

export function canManageRates(role: StaffRole): boolean {
  return hasRequiredRole(role, RATES_MANAGE_ROLES);
}
