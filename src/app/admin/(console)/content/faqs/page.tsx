import Link from "next/link";

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
import { requireStaff } from "@/lib/auth/require-staff";
import { canManageCms } from "@/lib/content/permissions";
import { listFaqsAdmin } from "@/lib/content/queries";

export default async function FaqsAdminPage() {
  const staff = await requireStaff();
  const faqs = await listFaqsAdmin();
  const canWrite = canManageCms(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQs"
        description="Published questions appear on the public help pages. Sort order is lowest first."
        actionHref={canWrite ? "/admin/content/faqs/new" : undefined}
        actionLabel={canWrite ? "New FAQ" : undefined}
      />
      {faqs.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No FAQs yet. Unpublished questions stay off the public site.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell className="font-medium">{faq.question}</TableCell>
                <TableCell>{faq.category}</TableCell>
                <TableCell>{faq.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={faq.published ? "secondary" : "outline"}>
                    {faq.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/content/faqs/${faq.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
