import Link from "next/link";
import { redirect } from "next/navigation";

import { PaymentCallbackStatus } from "@/components/booking/payment-callback-status";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { PageEyebrow } from "@/components/marketing/page-intro";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

export default async function PaymentCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  if (!reference) {
    redirect("/booking");
  }

  await reconcilePaystackPayment(reference, "callback");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <PageEyebrow>Payment</PageEyebrow>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Confirming your payment</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Do not close this page yet. We verify every payment securely on the server before
        updating your booking.
      </p>
      <DeskPanel className="mt-8">
        <PaymentCallbackStatus reference={reference} />
      </DeskPanel>
      <p className="mt-6 text-sm text-muted-foreground">
        Need help? <Link href="/booking">Access your booking</Link> with your reference and
        email.
      </p>
    </main>
  );
}
