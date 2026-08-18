"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteMediaAsset,
  updateMediaAsset,
  uploadMediaAsset,
} from "@/lib/content/actions";

type MediaItem = {
  id: string;
  altText: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
};

export function MediaLibrary({
  assets,
  canEdit,
}: {
  assets: MediaItem[];
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadMediaAsset, null);

  return (
    <section className="space-y-6" aria-labelledby="media-heading">
      <h2 id="media-heading" className="sr-only">
        Uploaded images
      </h2>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}

      {assets.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No website images yet. Upload a JPEG, PNG, WebP, or AVIF file up to 5 MB.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id}>
              <MediaCard asset={asset} canEdit={canEdit} />
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <form
          action={formAction}
          className="max-w-xl space-y-3 rounded-xl bg-card p-4 ring-1 ring-border"
        >
          <div className="space-y-1.5">
            <Label htmlFor="file">Upload image</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="altText">Alt text</Label>
            <Input
              id="altText"
              name="altText"
              required
              placeholder="Describe the image for screen readers"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function MediaCard({ asset, canEdit }: { asset: MediaItem; canEdit: boolean }) {
  const update = updateMediaAsset.bind(null, asset.id);
  const remove = deleteMediaAsset.bind(null, asset.id);
  const [updateState, updateAction, updatePending] = useActionState(update, null);
  const [deleteState, deleteAction, deletePending] = useActionState(remove, null);

  return (
    <article className="space-y-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {asset.url ? (
          <Image
            src={asset.url}
            alt={asset.altText}
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <p className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
            Preview unavailable until storage is configured.
          </p>
        )}
      </div>
      <p className="truncate text-sm font-medium">{asset.originalFilename}</p>
      {updateState?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {updateState.error}
        </p>
      ) : null}
      {deleteState?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {deleteState.error}
        </p>
      ) : null}
      {updateState?.success || deleteState?.success ? (
        <p className="text-sm text-success">
          {updateState?.success ?? deleteState?.success}
        </p>
      ) : null}
      {canEdit ? (
        <form action={updateAction} className="space-y-2">
          <Label htmlFor={`alt-${asset.id}`}>Alt text</Label>
          <Input
            id={`alt-${asset.id}`}
            name="altText"
            defaultValue={asset.altText}
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={updatePending}>
              Save alt
            </Button>
            {asset.url ? <CopyUrlButton url={asset.url} /> : null}
          </div>
        </form>
      ) : asset.url ? (
        <CopyUrlButton url={asset.url} />
      ) : null}
      {canEdit ? (
        <form action={deleteAction}>
          <Button type="submit" size="sm" variant="destructive" disabled={deletePending}>
            Remove if unused
          </Button>
        </form>
      ) : null}
    </article>
  );
}

function CopyUrlButton({ url }: { url: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
      }}
    >
      Copy URL
    </Button>
  );
}
