import { notFound } from "next/navigation";

import { PromotionForm } from "@/components/admin/rates/promotion-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { updatePromotionAction } from "@/lib/availability/admin-actions";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import { getPromotionAdmin } from "@/lib/pricing/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPromotionPage({ params }: PageProps) {
  await requireRole(RATES_MANAGE_ROLES);
  const { id } = await params;
  const promotion = await getPromotionAdmin(id);
  if (!promotion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={promotion.code}
        description="Changing a promotion does not alter existing quotes."
      />
      <PromotionForm
        action={updatePromotionAction.bind(null, id)}
        defaults={promotion}
        submitLabel="Save promotion"
      />
    </div>
  );
}
