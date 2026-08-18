import { notFound } from "next/navigation";

import { ExtraForm } from "@/components/admin/rates/extra-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { updateExtraAction } from "@/lib/availability/admin-actions";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import { getExtraAdmin } from "@/lib/pricing/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExtraPage({ params }: PageProps) {
  await requireRole(RATES_MANAGE_ROLES);
  const { id } = await params;
  const extra = await getExtraAdmin(id);
  if (!extra) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={extra.name} description="Changing the price does not alter existing quotes." />
      <ExtraForm
        action={updateExtraAction.bind(null, id)}
        defaults={extra}
        submitLabel="Save extra"
      />
    </div>
  );
}
