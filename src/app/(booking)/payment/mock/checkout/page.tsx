import { redirect } from "next/navigation";

import { markMockPaystackSuccess } from "@/lib/payments/paystack/mock-store";
import { paystackMockEnabled } from "@/lib/payments/paystack/config";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function MockPaystackCheckoutPage({ searchParams }: PageProps) {
  if (!paystackMockEnabled()) {
    redirect("/booking");
  }

  const params = await searchParams;
  const reference = params.reference;
  if (!reference) {
    redirect("/booking");
  }

  markMockPaystackSuccess(reference);
  await reconcilePaystackPayment(reference, "webhook");

  redirect(`/payment/callback?reference=${encodeURIComponent(reference)}`);
}
