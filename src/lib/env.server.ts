import "server-only";

import { z } from "zod";

import { asOptionalString } from "@/lib/env";
import { readCardatabaseApiKey } from "@/lib/env/cardatabase-key";
import {
  assertPreviewEnvironmentSafety,
  assertProductionEnvironmentSafety,
} from "@/lib/env/guards";

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  PAYSTACK_CALLBACK_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  CARDATABASE_API_KEY: z.string().min(1).optional(),
  CARDATABASE_BASE_URL: z.string().url().optional(),
  CARDATABASE_IMAGE_IMPORT_ENABLED: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: asOptionalString(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    DATABASE_URL: asOptionalString(process.env.DATABASE_URL),
    PAYSTACK_SECRET_KEY: asOptionalString(process.env.PAYSTACK_SECRET_KEY),
    PAYSTACK_CALLBACK_URL: asOptionalString(process.env.PAYSTACK_CALLBACK_URL),
    RESEND_API_KEY: asOptionalString(process.env.RESEND_API_KEY),
    EMAIL_FROM: asOptionalString(process.env.EMAIL_FROM),
    CRON_SECRET: asOptionalString(process.env.CRON_SECRET),
    CARDATABASE_API_KEY: readCardatabaseApiKey(),
    CARDATABASE_BASE_URL: asOptionalString(process.env.CARDATABASE_BASE_URL),
    CARDATABASE_IMAGE_IMPORT_ENABLED: asOptionalString(
      process.env.CARDATABASE_IMAGE_IMPORT_ENABLED,
    ),
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.message}`,
    );
  }

  assertProductionEnvironmentSafety(parsed.data);
  assertPreviewEnvironmentSafety(parsed.data);

  return parsed.data;
}

export const serverEnv = readServerEnv();

export function requireServerEnv<K extends keyof ServerEnv>(
  key: K,
): NonNullable<ServerEnv[K]> {
  const value = serverEnv[key];

  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
}
