import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const OPERATIONS_VIEW_ROLES = [
  "reservations",
  "fleet",
  "finance",
] as const;

export const OPERATIONS_MUTATE_ROLES = ["administrator", "reservations", "fleet"] as const;

export const SECURITY_DEPOSIT_MUTATE_ROLES = [
  "administrator",
  "reservations",
  "finance",
] as const;

export const MAINTENANCE_VIEW_ROLES = ["reservations", "fleet", "finance"] as const;
export const MAINTENANCE_MUTATE_ROLES = ["administrator", "fleet"] as const;

export function canViewOperations(role: StaffRole): boolean {
  return hasRequiredRole(role, OPERATIONS_VIEW_ROLES);
}

export function canMutateOperations(role: StaffRole): boolean {
  return hasRequiredRole(role, OPERATIONS_MUTATE_ROLES);
}

export const SECURITY_DEPOSIT_VIEW_ROLES = OPERATIONS_VIEW_ROLES;

export function canViewSecurityDeposits(role: StaffRole): boolean {
  return hasRequiredRole(role, SECURITY_DEPOSIT_VIEW_ROLES);
}

export function canMutateSecurityDeposit(role: StaffRole): boolean {
  return hasRequiredRole(role, SECURITY_DEPOSIT_MUTATE_ROLES);
}

export function canViewMaintenance(role: StaffRole): boolean {
  return hasRequiredRole(role, MAINTENANCE_VIEW_ROLES);
}

export function canMutateMaintenance(role: StaffRole): boolean {
  return hasRequiredRole(role, MAINTENANCE_MUTATE_ROLES);
}
