import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FaqForm } from "@/components/admin/content/faq-form";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import { deleteFaq, updateFaq } from "@/lib/content/actions";
import { canManageCms } from "@/lib/content/permissions";
import { getFaqAdmin } from "@/lib/content/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFaqPage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const faq = await getFaqAdmin(id);

  if (!faq) {
    notFound();
  }

  const canWrite = canManageCms(staff.role);
  const update = updateFaq.bind(null, id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit FAQ"
        description={canWrite ? "Update the answer or publishing status." : "Read-only view."}
      />
      {canWrite ? (
        <FaqForm
          action={update}
          defaults={{
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            sortOrder: faq.sortOrder,
            published: faq.published,
          }}
          submitLabel="Save FAQ"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {faq.question} This FAQ is {faq.published ? "published" : "a draft"}.
        </p>
      )}
      {canWrite ? (
        <form action={deleteFaq.bind(null, id)}>
          <Button type="submit" variant="destructive">
            Delete FAQ
          </Button>
        </form>
      ) : null}
    </div>
  );
}
