import Link from "next/link";

import { ExtraForm } from "@/components/admin/rates/extra-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import { createExtraAction } from "@/lib/availability/admin-actions";
import { listExtrasAdmin } from "@/lib/pricing/queries";
import { formatGhs } from "@/lib/money";

export default async function AdminExtrasPage() {
  await requireRole(RATES_MANAGE_ROLES);
  const extras = await listExtrasAdmin();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Extras"
        description="Optional add-ons priced once or per chargeable day. Amounts are stored as integer pesewas."
      />
      {extras.length === 0 ? (
        <p className="text-sm text-muted-foreground">No extras yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extras.map((extra) => (
              <TableRow key={extra.id}>
                <TableCell>{extra.name}</TableCell>
                <TableCell>{extra.pricingType === "per_day" ? "Per day" : "Once"}</TableCell>
                <TableCell>{formatGhs(extra.price)}</TableCell>
                <TableCell>
                  <Badge variant={extra.active ? "secondary" : "outline"}>
                    {extra.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/rates/extras/${extra.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">New extra</h2>
        <ExtraForm action={createExtraAction} submitLabel="Create extra" />
      </section>
    </div>
  );
}
