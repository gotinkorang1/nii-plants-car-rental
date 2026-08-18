import Link from "next/link";

import { PromotionForm } from "@/components/admin/rates/promotion-form";
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
import { createPromotionAction } from "@/lib/availability/admin-actions";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import { listPromotionsAdmin } from "@/lib/pricing/queries";

export default async function AdminPromotionsPage() {
  await requireRole(RATES_MANAGE_ROLES);
  const promotions = await listPromotionsAdmin();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Promotions"
        description="One promotion may apply per quote. Codes are matched case-insensitively."
      />
      {promotions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No promotions yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell>{promo.code}</TableCell>
                <TableCell>{promo.type}</TableCell>
                <TableCell>
                  <Badge variant={promo.active ? "secondary" : "outline"}>
                    {promo.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {promo.usageCount}
                  {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                </TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/rates/promotions/${promo.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">New promotion</h2>
        <PromotionForm action={createPromotionAction} submitLabel="Create promotion" />
      </section>
    </div>
  );
}
