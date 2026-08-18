import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const PAYMENT_VIEW_ROLES = ["finance", "reservations"] as const;
export const PAYMENT_RECONCILE_ROLES = ["finance"] as const;

export function canViewPayments(role: StaffRole): boolean {
  return hasRequiredRole(role, PAYMENT_VIEW_ROLES);
}

export function canViewPaymentSummary(role: StaffRole): boolean {
  return hasRequiredRole(role, [...PAYMENT_VIEW_ROLES, "fleet"]);
}

export function canReconcilePayments(role: StaffRole): boolean {
  return hasRequiredRole(role, PAYMENT_RECONCILE_ROLES);
}
