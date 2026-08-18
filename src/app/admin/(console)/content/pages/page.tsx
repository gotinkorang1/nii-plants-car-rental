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
import { listContentPagesAdmin } from "@/lib/content/queries";

export default async function ContentPagesAdminPage() {
  const staff = await requireStaff();
  const pages = await listContentPagesAdmin();
  const canWrite = canManageCms(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pages"
        description="CMS pages for public guides. Application routes such as /fleet stay reserved."
        actionHref={canWrite ? "/admin/content/pages/new" : undefined}
        actionLabel={canWrite ? "New page" : undefined}
      />
      {pages.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No CMS pages yet. Drafts stay hidden until they are published.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>/{page.slug}</TableCell>
                <TableCell>
                  <Badge variant={page.published ? "secondary" : "outline"}>
                    {page.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/content/pages/${page.id}`}>Open</Link>
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
