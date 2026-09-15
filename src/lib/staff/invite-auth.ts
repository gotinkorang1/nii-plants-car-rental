import "server-only";

import { publicEnv } from "@/lib/env";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

function staffInviteRedirectTo() {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/admin/set-password`;
}

export type StaffAuthInvite = {
  userId: string;
  actionLink: string;
  kind: "invite" | "recovery";
};

function inviteFailureMessage() {
  return "The Auth user could not be created. Check SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY and Auth settings.";
}

export async function createStaffAuthInvite(input: {
  email: string;
  displayName: string;
}): Promise<StaffAuthInvite | { error: string }> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      error:
        "Staff invites need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const redirectTo = staffInviteRedirectTo();
  const invited = await admin.auth.admin.generateLink({
    type: "invite",
    email: input.email,
    options: {
      data: { display_name: input.displayName },
      redirectTo,
    },
  });

  if (!invited.error && invited.data.user) {
    return {
      userId: invited.data.user.id,
      actionLink: invited.data.properties.action_link,
      kind: "invite",
    };
  }

  const recovery = await admin.auth.admin.generateLink({
    type: "recovery",
    email: input.email,
    options: { redirectTo },
  });

  if (recovery.error || !recovery.data.user) {
    return { error: inviteFailureMessage() };
  }

  return {
    userId: recovery.data.user.id,
    actionLink: recovery.data.properties.action_link,
    kind: "recovery",
  };
}

export async function createStaffRecoveryLink(email: string): Promise<
  { actionLink: string } | { error: string }
> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      error:
        "Password links need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY on the server.",
    };
  }

  const recovery = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: staffInviteRedirectTo() },
  });

  if (recovery.error || !recovery.data.properties?.action_link) {
    return { error: inviteFailureMessage() };
  }

  return { actionLink: recovery.data.properties.action_link };
}
