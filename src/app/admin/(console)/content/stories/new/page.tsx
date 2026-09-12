import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentPostForm } from "@/components/admin/content/content-post-form";
import { requireRole } from "@/lib/auth/require-role";
import { createContentPost } from "@/lib/content/actions";
import { getWebsiteMediaPublicUrl } from "@/lib/content/media-url";
import { CMS_MANAGE_ROLES } from "@/lib/content/permissions";
import { listMediaAssetsAdmin } from "@/lib/content/queries";
import { CONTENT_STORY_KINDS } from "@/lib/validation/content";

export default async function NewStoryPage() {
  await requireRole(CMS_MANAGE_ROLES);
  const assets = await listMediaAssetsAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New story"
        description="News and blogs need a body. Video posts need a YouTube or Vimeo https link."
      />
      <ContentPostForm
        action={createContentPost}
        submitLabel="Publish story"
        kinds={CONTENT_STORY_KINDS}
        media={assets.map((asset) => ({
          id: asset.id,
          altText: asset.altText,
          originalFilename: asset.originalFilename,
          url: getWebsiteMediaPublicUrl(asset.storagePath),
        }))}
      />
    </div>
  );
}
