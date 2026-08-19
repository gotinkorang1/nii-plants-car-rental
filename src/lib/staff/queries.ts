import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { tryGetDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";

export type StaffListItem = {
  id: string;
  displayName: string;
  email: string;
  role: StaffRole;
  active: boolean;
};

export async function listStaffProfiles(): Promise<StaffListItem[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select({
      id: staffProfiles.id,
      displayName: staffProfiles.displayName,
      email: staffProfiles.email,
      role: staffProfiles.role,
      active: staffProfiles.active,
    })
    .from(staffProfiles)
    .orderBy(desc(staffProfiles.active), staffProfiles.displayName);

  return rows.filter((row): row is StaffListItem => isStaffRole(row.role));
}

export async function getStaffProfileAdmin(
  id: string,
): Promise<StaffListItem | null> {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      id: staffProfiles.id,
      displayName: staffProfiles.displayName,
      email: staffProfiles.email,
      role: staffProfiles.role,
      active: staffProfiles.active,
    })
    .from(staffProfiles)
    .where(eq(staffProfiles.id, id))
    .limit(1);

  if (!row || !isStaffRole(row.role)) {
    return null;
  }

  return row;
}

export async function countActiveAdministrators(): Promise<number> {
  const db = tryGetDb();
  if (!db) {
    return 0;
  }

  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(staffProfiles)
    .where(
      and(
        eq(staffProfiles.role, "administrator"),
        eq(staffProfiles.active, true),
      ),
    );

  return Number(row?.value ?? 0);
}

export async function findStaffProfileByEmail(email: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({
      id: staffProfiles.id,
      authUserId: staffProfiles.authUserId,
      email: staffProfiles.email,
    })
    .from(staffProfiles)
    .where(sql`lower(${staffProfiles.email}) = ${normalized}`)
    .limit(1);

  return row ?? null;
}
