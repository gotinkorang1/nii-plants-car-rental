import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentPageForm } from "@/components/admin/content/content-page-form";
import { requireRole } from "@/lib/auth/require-role";
import { createContentPage } from "@/lib/content/actions";
import { CMS_MANAGE_ROLES } from "@/lib/content/permissions";

export default async function NewContentPagePage() {
  await requireRole(CMS_MANAGE_ROLES);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New page"
        description="Reserved slugs such as admin, fleet, and book cannot be used."
      />
      <ContentPageForm action={createContentPage} submitLabel="Create page" />
    </div>
  );
}
