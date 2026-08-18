import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  listClassOptions,
  listVehicleModels,
} from "@/lib/fleet/admin-queries";
import { getFleetMediaPublicUrl } from "@/lib/fleet/image-url";
import { canManageFleet } from "@/lib/fleet/permissions";

type PageProps = {
  searchParams: Promise<{ q?: string; classId?: string; published?: string }>;
};

export default async function VehicleModelsPage({ searchParams }: PageProps) {
  const staff = await requireStaff();
  const params = await searchParams;
  const published =
    params.published === "published" || params.published === "unpublished"
      ? params.published
      : "all";
  const [models, classes] = await Promise.all([
    listVehicleModels({
      search: params.q,
      classId: params.classId,
      published,
    }),
    listClassOptions(),
  ]);
  const canWrite = canManageFleet(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vehicle models"
        description="Public catalogue models. Unpublished models never appear on /fleet."
        actionHref={canWrite ? "/admin/fleet/models/new" : undefined}
        actionLabel={canWrite ? "New model" : undefined}
      />
      <form method="get" className="grid gap-2 sm:grid-cols-4">
        <Input name="q" defaultValue={params.q} placeholder="Search models" aria-label="Search models" />
        <select
          name="classId"
          defaultValue={params.classId ?? ""}
          aria-label="Filter by class"
          className="h-8 rounded-lg border border-input px-2.5 text-sm"
        >
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="published"
          defaultValue={published}
          aria-label="Filter by published state"
          className="h-8 rounded-lg border border-input px-2.5 text-sm"
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {models.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No models match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Make / Model</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Transmission</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Physical units</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((item) => {
              const imageUrl = item.primaryImage
                ? getFleetMediaPublicUrl(item.primaryImage.storagePath)
                : null;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.primaryImage?.altText ?? ""}
                        width={64}
                        height={48}
                        className="h-12 w-16 rounded object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.make} {item.model}
                  </TableCell>
                  <TableCell>{item.className}</TableCell>
                  <TableCell>{item.seats}</TableCell>
                  <TableCell className="capitalize">{item.transmission}</TableCell>
                  <TableCell>{item.featured ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant={item.published ? "secondary" : "outline"}>
                      {item.published ? "Published" : "Unpublished"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unitCount}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/fleet/models/${item.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
