import { NextResponse } from "next/server";

import { log } from "@/lib/logger";
import { verifyPaystackSignature } from "@/lib/payments/paystack/signature";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    log("warn", "paystack_signature_failed", {});
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  log("info", "paystack_webhook_received", { event: payload.event ?? "unknown" });

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    return NextResponse.json({ received: true });
  }

  try {
    await reconcilePaystackPayment(reference, "webhook");
    return NextResponse.json({ received: true });
  } catch (error) {
    log("error", "paystack_webhook_processing_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}
