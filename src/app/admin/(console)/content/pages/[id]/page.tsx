import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentPageForm } from "@/components/admin/content/content-page-form";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  deleteContentPage,
  unpublishContentPage,
  updateContentPage,
} from "@/lib/content/actions";
import { canManageCms } from "@/lib/content/permissions";
import { getContentPageAdmin } from "@/lib/content/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContentPagePage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const page = await getContentPageAdmin(id);

  if (!page) {
    notFound();
  }

  const canWrite = canManageCms(staff.role);
  const update = updateContentPage.bind(null, id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={page.title}
        description={
          canWrite
            ? "Edit copy, SEO fields, or publishing status."
            : "Read-only view."
        }
      />
      {canWrite ? (
        <ContentPageForm
          action={update}
          defaults={{
            title: page.title,
            slug: page.slug,
            excerpt: page.excerpt,
            body: page.body,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            published: page.published,
          }}
          submitLabel="Save page"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          /{page.slug} is {page.published ? "published" : "a draft"}.
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
              Delete page
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
