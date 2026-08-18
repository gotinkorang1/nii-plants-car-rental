import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqForm } from "@/components/admin/content/faq-form";
import { requireRole } from "@/lib/auth/require-role";
import { createFaq } from "@/lib/content/actions";
import { CMS_MANAGE_ROLES } from "@/lib/content/permissions";

export default async function NewFaqPage() {
  await requireRole(CMS_MANAGE_ROLES);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New FAQ"
        description="Keep answers factual. Do not invent policy values that are not configured."
      />
      <FaqForm action={createFaq} submitLabel="Create FAQ" />
    </div>
  );
}
