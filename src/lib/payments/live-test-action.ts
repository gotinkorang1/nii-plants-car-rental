"use server";

import { z } from "zod";

import { requireRoleAction } from "@/lib/auth/require-role";
import { formString } from "@/lib/fleet/action-helpers";
import { publicEnv } from "@/lib/env";
import { generatePaymentReference } from "@/lib/payments/generate-payment-reference";
import {
  buildLivePaymentTestPayload,
  LIVE_PAYMENT_TEST_AMOUNT,
} from "@/lib/payments/paystack/live-test";
import { paystackRequest } from "@/lib/payments/paystack/client";

const livePaymentTestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
});

export type LivePaymentTestState = {
  error?: string;
  authorizationUrl?: string;
  reference?: string;
  amount?: number;
};

export async function initializeLivePaymentTest(
  _previous: LivePaymentTestState,
  formData: FormData,
): Promise<LivePaymentTestState> {
  await requireRoleAction(["finance"]);

  const parsed = livePaymentTestSchema.safeParse({
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the test details." };
  }

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return { error: "The production app URL is not configured." };
  }

  const reference = generatePaymentReference().replace("NP-PAY", "NP-TEST");
  const payload = buildLivePaymentTestPayload({
    ...parsed.data,
    reference,
    callbackUrl: `${baseUrl}/admin/payments/test/callback`,
  });

  try {
    const response = await paystackRequest<{
      authorization_url: string;
      reference: string;
    }>({
      path: "/transaction/initialize",
      method: "POST",
      body: payload,
    });

    return {
      authorizationUrl: response.authorization_url,
      reference: response.reference,
      amount: LIVE_PAYMENT_TEST_AMOUNT,
    };
  } catch {
    return {
      error: "Paystack could not start the live test. Check the live account configuration and try again.",
    };
  }
}
