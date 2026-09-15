"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFleetMediaPublicUrl } from "@/lib/fleet/image-url";
import {
  deleteVehicleImage,
  markVehicleImagePrimary,
  updateVehicleImage,
  uploadVehicleImage,
} from "@/lib/fleet/vehicle-image-actions";

type ImageItem = {
  id: string;
  storagePath: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  sourceProvider?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  cardatabase: "CarDatabase",
};

/** Admin-only provenance badge. Not shown on public pages. */
function sourceLabel(sourceProvider: string | null | undefined): string {
  if (!sourceProvider) {
    return "Nii Plants upload";
  }

  return SOURCE_LABELS[sourceProvider] ?? sourceProvider;
}

export function VehicleImageManager({
  modelId,
  images,
  canEdit,
}: {
  modelId: string;
  images: ImageItem[];
  canEdit: boolean;
}) {
  const upload = uploadVehicleImage.bind(null, modelId);
  const [state, formAction, pending] = useActionState(upload, null);

  return (
    <section className="space-y-4" aria-labelledby="images-heading">
      <h2 id="images-heading" className="text-lg font-medium">
        Images
      </h2>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-success">{state.success}</p>
      ) : null}

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No images yet. Upload a JPEG, PNG, WebP, or AVIF file up to 5 MB.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <ImageRow key={image.id} image={image} canEdit={canEdit} />
          ))}
        </ul>
      )}

      {canEdit ? (
        <form action={formAction} className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="space-y-1.5">
            <Label htmlFor="file">Upload image</Label>
            <Input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="altText">Alt text</Label>
            <Input id="altText" name="altText" required placeholder="White sedan, front three-quarter view" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={images.length} />
            </div>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input type="checkbox" name="isPrimary" defaultChecked={images.length === 0} />
              Primary image
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function ImageRow({ image, canEdit }: { image: ImageItem; canEdit: boolean }) {
  const url = getFleetMediaPublicUrl(image.storagePath);
  const update = updateVehicleImage.bind(null, image.id);
  const [state, formAction, pending] = useActionState(update, null);

  return (
    <li className="space-y-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {url ? (
          <Image src={url} alt={image.altText} fill sizes="300px" className="object-cover" />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Source: {sourceLabel(image.sourceProvider)}
      </p>
      {canEdit ? (
        <form action={formAction} className="space-y-2">
          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Label htmlFor={`alt-${image.id}`}>Alt text</Label>
          <Input id={`alt-${image.id}`} name="altText" defaultValue={image.altText} required />
          <Label htmlFor={`sort-${image.id}`}>Sort order</Label>
          <Input id={`sort-${image.id}`} name="sortOrder" type="number" min={0} defaultValue={image.sortOrder} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPrimary" defaultChecked={image.isPrimary} />
            Primary
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
            <Button formAction={markVehicleImagePrimary.bind(null, image.id)} variant="outline" size="sm">
              Mark primary
            </Button>
            <Button formAction={deleteVehicleImage.bind(null, image.id)} variant="destructive" size="sm">
              Remove
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm">{image.altText}</p>
      )}
    </li>
  );
}
