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
import { listContentPostsAdmin } from "@/lib/content/queries";

export default async function GalleryAdminPage() {
  const staff = await requireStaff();
  const albums = await listContentPostsAdmin(["gallery"]);
  const canWrite = canManageCms(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery albums"
        description="Published albums appear on /gallery. Upload photos in Media, then tick them into an album."
        actionHref={canWrite ? "/admin/content/gallery/new" : undefined}
        actionLabel={canWrite ? "New album" : undefined}
      />
      {albums.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No staff albums yet. The public gallery still shows the Accra hire
          photographs shipped with the site until you publish an album.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {albums.map((album) => (
              <TableRow key={album.id}>
                <TableCell className="font-medium">{album.title}</TableCell>
                <TableCell>
                  <Badge variant={album.published ? "secondary" : "outline"}>
                    {album.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/content/gallery/${album.id}`}>Open</Link>
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
