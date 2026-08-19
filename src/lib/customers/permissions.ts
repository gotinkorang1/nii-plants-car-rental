import type { StaffRole } from "@/lib/auth/roles";
import {
  BOOKING_VIEW_ROLES,
  canViewBookings,
} from "@/lib/bookings/permissions";

/** Same staff who may see booking PII may see the customer CRM. */
export const CUSTOMER_VIEW_ROLES = BOOKING_VIEW_ROLES;

export function canViewCustomers(role: StaffRole): boolean {
  return canViewBookings(role);
}
