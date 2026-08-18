import type { StaffRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

export const ENQUIRY_VIEW_ROLES = [
  "reservations",
  "fleet",
  "finance",
] as const;

export const ENQUIRY_MUTATE_ROLES = ["administrator", "reservations"] as const;

export function canViewEnquiries(role: StaffRole): boolean {
  return hasRequiredRole(role, ENQUIRY_VIEW_ROLES);
}

export function canMutateEnquiries(role: StaffRole): boolean {
  return hasRequiredRole(role, ENQUIRY_MUTATE_ROLES);
}

export function canViewEnquiryQuotes(role: StaffRole): boolean {
  return hasRequiredRole(role, [...ENQUIRY_VIEW_ROLES]);
}
