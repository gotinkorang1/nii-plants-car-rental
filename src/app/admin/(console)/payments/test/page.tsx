import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LivePaymentTestForm } from "@/components/admin/payments/live-payment-test-form";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminPaymentTestPage() {
  await requireRole(["finance"]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Paystack live test"
        description="Run one controlled GH₵3 hosted-checkout test and verify the live callback."
      />
      <LivePaymentTestForm
        defaultEmail="gotinkorang@gmail.com"
        defaultPhone="0554664733"
      />
      <Button asChild variant="outline">
        <Link href="/admin/payments">Back to payments</Link>
      </Button>
    </div>
  );
}
