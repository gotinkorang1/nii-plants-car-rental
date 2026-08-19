import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentPostForm } from "@/components/admin/content/content-post-form";
import { requireRole } from "@/lib/auth/require-role";
import { createContentPost } from "@/lib/content/actions";
import { getWebsiteMediaPublicUrl } from "@/lib/content/media-url";
import { CMS_MANAGE_ROLES } from "@/lib/content/permissions";
import { listMediaAssetsAdmin } from "@/lib/content/queries";

export default async function NewGalleryAlbumPage() {
  await requireRole(CMS_MANAGE_ROLES);
  const assets = await listMediaAssetsAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New gallery album"
        description="Choose photos from the media library. Drafts stay off /gallery until you publish."
      />
      <ContentPostForm
        action={createContentPost}
        submitLabel="Save album"
        kinds={["gallery"]}
        defaults={{
          kind: "gallery",
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          seoTitle: null,
          seoDescription: null,
          coverMediaId: null,
          videoUrl: null,
          publishedOn: "",
          sortOrder: 0,
          mediaIds: [],
          published: false,
        }}
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
