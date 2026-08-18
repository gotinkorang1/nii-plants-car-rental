import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  purpose: z.enum(["initial", "balance"]).optional(),
});

export const paymentStatusQuerySchema = z.object({
  reference: z.string().trim().min(8).max(40),
});

export const staffRecheckPaymentSchema = z.object({
  paymentId: z.string().uuid(),
});

export const staffAssignReviewVehicleSchema = z.object({
  bookingId: z.string().uuid(),
});
