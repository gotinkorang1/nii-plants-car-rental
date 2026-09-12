import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentPostForm } from "@/components/admin/content/content-post-form";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  deleteContentPage,
  unpublishContentPage,
  updateContentPost,
} from "@/lib/content/actions";
import { getWebsiteMediaPublicUrl } from "@/lib/content/media-url";
import { canManageCms } from "@/lib/content/permissions";
import {
  getContentPageAdmin,
  listContentPageMedia,
  listMediaAssetsAdmin,
} from "@/lib/content/queries";
import { CONTENT_STORY_KINDS } from "@/lib/validation/content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStoryPage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const [page, assets, attached] = await Promise.all([
    getContentPageAdmin(id),
    listMediaAssetsAdmin(),
    listContentPageMedia(id),
  ]);

  if (
    !page ||
    (page.kind !== "news" && page.kind !== "blog" && page.kind !== "video")
  ) {
    notFound();
  }

  const canWrite = canManageCms(staff.role);
  const update = updateContentPost.bind(null, id);
  const media = assets.map((asset) => ({
    id: asset.id,
    altText: asset.altText,
    originalFilename: asset.originalFilename,
    url: getWebsiteMediaPublicUrl(asset.storagePath),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={page.title}
        description={canWrite ? "Edit and publish this story." : "Read-only view."}
      />
      {canWrite ? (
        <ContentPostForm
          action={update}
          kinds={CONTENT_STORY_KINDS}
          media={media}
          defaults={{
            kind: page.kind,
            title: page.title,
            slug: page.slug,
            excerpt: page.excerpt,
            body: page.body,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            coverMediaId: page.coverMediaId,
            videoUrl: page.videoUrl,
            publishedOn: page.publishedAt
              ? page.publishedAt.toISOString().slice(0, 10)
              : "",
            sortOrder: page.sortOrder,
            mediaIds: attached.map((item) => item.mediaId),
            published: page.published,
          }}
          submitLabel="Save story"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          /news/{page.slug} is {page.published ? "published" : "a draft"}.
        </p>
      )}
      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          {page.published ? (
            <form action={unpublishContentPage.bind(null, id)}>
              <Button type="submit" variant="outline">
                Unpublish
              </Button>
            </form>
          ) : null}
          <form action={deleteContentPage.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
