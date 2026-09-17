import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { verifyPaystackTransaction } from "@/lib/payments/paystack/verify";
import { formatGhs } from "@/lib/money";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function AdminPaymentTestCallbackPage({ searchParams }: PageProps) {
  await requireRole(["finance"]);
  const { reference } = await searchParams;
  const verification = reference
    ? await verifyPaystackTransaction(reference).catch(() => null)
    : null;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Paystack test result"
        description="The result below comes from Paystack verification, not the browser redirect alone."
      />
      <div className="max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        {!verification ? (
          <p role="alert" className="text-sm text-destructive">The payment could not be verified.</p>
        ) : (
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="font-semibold">{verification.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reference</dt><dd className="font-mono text-xs">{verification.reference}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Amount</dt><dd>{formatGhs(verification.amount)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Channel</dt><dd>{verification.channel ?? "—"}</dd></div>
          </dl>
        )}
      </div>
      <Button asChild variant="outline"><Link href="/admin/payments/test">Run another test</Link></Button>
    </div>
  );
}
