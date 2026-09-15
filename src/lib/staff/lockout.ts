import type { StaffRole } from "@/lib/auth/roles";

export const LAST_ADMINISTRATOR_MESSAGE =
  "Keep at least one active administrator. Invite another administrator before changing this account.";

export function wouldRemoveLastAdministrator(input: {
  currentRole: StaffRole;
  currentActive: boolean;
  nextRole: StaffRole;
  nextActive: boolean;
  activeAdministratorCount: number;
}): boolean {
  const countedNow =
    input.currentRole === "administrator" && input.currentActive;
  const countedNext = input.nextRole === "administrator" && input.nextActive;

  if (!countedNow || countedNext) {
    return false;
  }

  return input.activeAdministratorCount <= 1;
}
