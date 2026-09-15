"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { STAFF_ROLE_LABELS } from "@/lib/auth/roles";
import { tryGetDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send-email";
import { staffInviteEmail } from "@/lib/email/templates";
import {
  type ActionState,
  formCheckbox,
  formString,
  isUniqueViolation,
} from "@/lib/fleet/action-helpers";
import { createStaffAuthInvite, createStaffRecoveryLink } from "@/lib/staff/invite-auth";
import {
  LAST_ADMINISTRATOR_MESSAGE,
  wouldRemoveLastAdministrator,
} from "@/lib/staff/lockout";
import { STAFF_MANAGE_ROLES } from "@/lib/staff/permissions";
import {
  countActiveAdministrators,
  findStaffProfileByEmail,
  getStaffProfileAdmin,
} from "@/lib/staff/queries";
import { inviteStaffSchema, updateStaffSchema } from "@/lib/validation/staff";

function revalidateStaffPages(staffId?: string) {
  revalidatePath("/admin/staff");
  if (staffId) {
    revalidatePath(`/admin/staff/${staffId}`);
  }
}

async function deliverStaffInviteEmail(input: {
  email: string;
  displayName: string;
  role: keyof typeof STAFF_ROLE_LABELS;
  inviteUrl: string;
}) {
  return sendEmail({
    to: input.email,
    email: staffInviteEmail({
      displayName: input.displayName,
      roleLabel: STAFF_ROLE_LABELS[input.role],
      inviteUrl: input.inviteUrl,
    }),
  });
}

function inviteSuccessMessage(emailSent: boolean, transport: "resend" | "outbox") {
  if (!emailSent) {
    return "Staff account created, but the invite email could not be sent. Ask the person to use a password recovery link, or configure Resend (EMAIL_FROM and RESEND_API_KEY).";
  }

  if (transport === "outbox") {
    return "Staff account created. The invite was recorded in the development email outbox because Resend is not sending in this environment.";
  }

  return "Invite sent. The person can choose a password from the email link, then sign in.";
}

export async function inviteStaffAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRoleAction(STAFF_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = inviteStaffSchema.safeParse({
    displayName: formString(formData, "displayName"),
    email: formString(formData, "email"),
    role: formString(formData, "role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the staff details." };
  }

  const existing = await findStaffProfileByEmail(parsed.data.email);
  if (existing) {
    return { error: "That email is already on the staff list." };
  }

  const authInvite = await createStaffAuthInvite({
    email: parsed.data.email,
    displayName: parsed.data.displayName,
  });
  if ("error" in authInvite) {
    return { error: authInvite.error };
  }

  try {
    const [created] = await db
      .insert(staffProfiles)
      .values({
        authUserId: authInvite.userId,
        displayName: parsed.data.displayName,
        email: parsed.data.email,
        role: parsed.data.role,
        active: true,
      })
      .returning({ id: staffProfiles.id });

    if (!created) {
      return { error: "The staff profile could not be saved." };
    }

    const delivered = await deliverStaffInviteEmail({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      inviteUrl: authInvite.actionLink,
    });

    await writeAuditLog({
      actorType: "staff",
      actorId: actor.id,
      action: "staff.invite",
      entityType: "staff_profile",
      entityId: created.id,
      metadata: {
        email: parsed.data.email,
        role: parsed.data.role,
        authKind: authInvite.kind,
        emailOk: delivered.ok,
        emailTransport: delivered.transport,
      },
    });

    revalidateStaffPages(created.id);
    return { success: inviteSuccessMessage(delivered.ok, delivered.transport) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "That email or Auth user is already on the staff list." };
    }

    return { error: "The staff profile could not be saved." };
  }
}

export async function updateStaffAction(
  staffId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireRoleAction(STAFF_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = updateStaffSchema.safeParse({
    displayName: formString(formData, "displayName"),
    role: formString(formData, "role"),
    active: formCheckbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the staff details." };
  }

  const existing = await getStaffProfileAdmin(staffId);
  if (!existing) {
    return { error: "That staff account was not found." };
  }

  const activeAdministratorCount = await countActiveAdministrators();
  if (
    wouldRemoveLastAdministrator({
      currentRole: existing.role,
      currentActive: existing.active,
      nextRole: parsed.data.role,
      nextActive: parsed.data.active,
      activeAdministratorCount,
    })
  ) {
    return { error: LAST_ADMINISTRATOR_MESSAGE };
  }

  const becameInactive = existing.active && !parsed.data.active;

  try {
    await db
      .update(staffProfiles)
      .set({
        displayName: parsed.data.displayName,
        role: parsed.data.role,
        active: parsed.data.active,
      })
      .where(eq(staffProfiles.id, staffId));
  } catch (error) {
    return {
      error: isUniqueViolation(error)
        ? "That email is already on the staff list."
        : "The staff account could not be updated.",
    };
  }

  await writeAuditLog({
    actorType: "staff",
    actorId: actor.id,
    action: becameInactive ? "staff.deactivate" : "staff.update",
    entityType: "staff_profile",
    entityId: staffId,
    metadata: {
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      active: parsed.data.active,
    },
  });

  revalidateStaffPages(staffId);
  return {
    success: becameInactive ? "Staff account deactivated." : "Staff account saved.",
  };
}

export async function resendStaffInviteAction(
  staffId: string,
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  void previous;
  void formData;
  const actor = await requireRoleAction(STAFF_MANAGE_ROLES);
  const existing = await getStaffProfileAdmin(staffId);
  if (!existing) {
    return { error: "That staff account was not found." };
  }

  if (!existing.active) {
    return { error: "Reactivate this account before sending a password link." };
  }

  const recovery = await createStaffRecoveryLink(existing.email);
  if ("error" in recovery) {
    return { error: recovery.error };
  }

  const delivered = await deliverStaffInviteEmail({
    email: existing.email,
    displayName: existing.displayName,
    role: existing.role,
    inviteUrl: recovery.actionLink,
  });

  await writeAuditLog({
    actorType: "staff",
    actorId: actor.id,
    action: "staff.invite",
    entityType: "staff_profile",
    entityId: staffId,
    metadata: {
      email: existing.email,
      role: existing.role,
      resend: true,
      emailOk: delivered.ok,
      emailTransport: delivered.transport,
    },
  });

  revalidateStaffPages(staffId);
  return { success: inviteSuccessMessage(delivered.ok, delivered.transport) };
}
