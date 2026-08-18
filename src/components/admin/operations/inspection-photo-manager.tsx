"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteInspectionPhotoAction, uploadInspectionPhotoAction } from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

const categories = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "left", label: "Left side" },
  { value: "right", label: "Right side" },
  { value: "interior", label: "Interior" },
  { value: "dashboard", label: "Dashboard" },
  { value: "odometer", label: "Odometer" },
  { value: "fuel", label: "Fuel gauge" },
  { value: "damage", label: "Damage" },
  { value: "other", label: "Other" },
] as const;

type PhotoItem = {
  id: string;
  category: string;
  caption: string | null;
  signedUrl: string | null;
};

export function InspectionPhotoManager({
  bookingId,
  inspectionType,
  photos,
  canEdit,
}: {
  bookingId: string;
  inspectionType: "pickup" | "return";
  photos: PhotoItem[];
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    uploadInspectionPhotoAction,
    null as ActionState,
  );

  return (
    <section className="space-y-4" aria-labelledby={`${inspectionType}-photos-heading`}>
      <h3 id={`${inspectionType}-photos-heading`} className="text-base font-medium">
        Inspection photos
      </h3>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet. Upload JPEG, PNG, or WebP files up to 10 MB.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <li key={photo.id} className="space-y-2 rounded-xl bg-card p-3 ring-1 ring-border">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {photo.signedUrl ? (
                  <Image
                    src={photo.signedUrl}
                    alt={photo.caption ?? photo.category}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
              </div>
              <p className="text-sm capitalize">
                {photo.category.replaceAll("_", " ")}
                {photo.caption ? ` · ${photo.caption}` : ""}
              </p>
              {canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => deleteInspectionPhotoAction(photo.id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <form action={formAction} className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="inspectionType" value={inspectionType} />
          <div className="space-y-1.5">
            <Label htmlFor={`${inspectionType}-photo-file`}>Photo</Label>
            <Input
              id={`${inspectionType}-photo-file`}
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${inspectionType}-photo-category`}>Category</Label>
            <select
              id={`${inspectionType}-photo-category`}
              name="category"
              required
              disabled={pending}
              className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${inspectionType}-photo-caption`}>Caption</Label>
            <Input
              id={`${inspectionType}-photo-caption`}
              name="caption"
              disabled={pending}
              placeholder="Optional note"
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Uploading…" : "Upload photo"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
