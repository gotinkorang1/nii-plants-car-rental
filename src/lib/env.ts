import { z } from "zod";

export function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: asOptionalString(process.env.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: asOptionalString(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: asOptionalString(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export const publicEnv = readPublicEnv();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function requirePublicEnv<K extends keyof PublicEnv>(
  key: K,
): NonNullable<PublicEnv[K]> {
  const value = publicEnv[key];

  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
}
