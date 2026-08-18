export const STAFF_ROLES = [
  "administrator",
  "reservations",
  "fleet",
  "finance",
  "content_editor",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  administrator: "Administrator",
  reservations: "Reservations",
  fleet: "Fleet",
  finance: "Finance",
  content_editor: "Content editor",
};

export function isStaffRole(value: unknown): value is StaffRole {
  return (
    typeof value === "string" &&
    (STAFF_ROLES as readonly string[]).includes(value)
  );
}

export function hasRequiredRole(
  userRole: StaffRole,
  allowed: StaffRole | readonly StaffRole[],
): boolean {
  if (userRole === "administrator") {
    return true;
  }

  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  return allowedRoles.includes(userRole);
}
