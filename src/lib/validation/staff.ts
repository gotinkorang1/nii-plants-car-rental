import { z } from "zod";

import { STAFF_ROLES } from "@/lib/auth/roles";

export const staffRoleInputSchema = z.enum(STAFF_ROLES, {
  message: "Choose a staff role.",
});

export const inviteStaffSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(120, "Display name is too long."),
  email: z
    .email("Enter a valid email address.")
    .transform((value) => value.trim().toLowerCase()),
  role: staffRoleInputSchema,
});

export const updateStaffSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(120, "Display name is too long."),
  role: staffRoleInputSchema,
  active: z.boolean(),
});

export const setStaffPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm the password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
