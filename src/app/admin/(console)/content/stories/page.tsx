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
import { CONTENT_STORY_KINDS } from "@/lib/validation/content";

export default async function StoriesAdminPage() {
  const staff = await requireStaff();
  const posts = await listContentPostsAdmin(CONTENT_STORY_KINDS);
  const canWrite = canManageCms(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="News, blogs and video"
        description="Published items appear on /news. Upload images in Media. Video posts need a YouTube or Vimeo link."
        actionHref={canWrite ? "/admin/content/stories/new" : undefined}
        actionLabel={canWrite ? "New story" : undefined}
      />
      {posts.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No staff stories yet. The public news page still shows the three Accra
          articles shipped with the site until you publish your own.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="capitalize">{post.kind}</TableCell>
                <TableCell>
                  <Badge variant={post.published ? "secondary" : "outline"}>
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/content/stories/${post.id}`}>Open</Link>
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
