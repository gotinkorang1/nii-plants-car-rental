import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const BOOKING_VIEW_ROLES = ["reservations", "fleet", "finance"] as const;
export const BOOKING_OPERATE_ROLES = ["reservations"] as const;

export function canViewBookings(role: StaffRole): boolean {
  return hasRequiredRole(role, BOOKING_VIEW_ROLES);
}

export function canOperateBookings(role: StaffRole): boolean {
  return hasRequiredRole(role, BOOKING_OPERATE_ROLES);
}
