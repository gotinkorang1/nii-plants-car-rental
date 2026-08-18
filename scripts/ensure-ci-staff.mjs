import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const email = process.env.TEST_STAFF_EMAIL ?? "ci-admin@example.test";
const password = process.env.TEST_STAFF_PASSWORD ?? "Ci-Staff-Password-123!";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL are required.",
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(databaseUrl, { max: 1 });

async function ensureCiStaff() {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list.data.users.find(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error("Failed to create CI staff auth user.");
    }
    user = created.data.user;
    console.log("Created CI staff auth user.");
  } else {
    await admin.auth.admin.updateUserById(user.id, { password });
    console.log("Updated CI staff auth user password.");
  }

  await sql`
    INSERT INTO staff_profiles (auth_user_id, display_name, email, role, active)
    VALUES (
      ${user.id}::uuid,
      ${"CI Administrator"},
      ${email},
      ${"administrator"},
      ${true}
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      display_name = excluded.display_name,
      email = excluded.email,
      role = excluded.role,
      active = excluded.active
  `;

  console.log(`CI staff ready: ${email}`);
}

ensureCiStaff()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 1 });
  });
