import { NextResponse } from "next/server";

import { getPaymentStatusForGuest } from "@/lib/payments/create-payment";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";
import { paymentStatusQuerySchema } from "@/lib/validation/payment";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = paymentStatusQuerySchema.safeParse({
    reference: url.searchParams.get("reference") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ status: "not_found" }, { status: 400 });
  }

  await reconcilePaystackPayment(parsed.data.reference, "callback");

  const result = await getPaymentStatusForGuest(parsed.data.reference);
  if (result.status === "not_found") {
    return NextResponse.json({ status: "not_found" });
  }

  return NextResponse.json({
    status: result.status,
    bookingReference: result.hasSession ? result.booking?.reference ?? null : null,
    purpose: result.payment.purpose,
    amount: result.payment.amount,
  });
}
