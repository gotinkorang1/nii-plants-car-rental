"use client";

import Image from "next/image";
import { useId } from "react";

import type { VehicleImportImage } from "@/lib/vehicle-data/import-payload";

/**
 * Import gallery for provider images.
 *
 * Nothing is imported automatically: staff pick the images they want and choose
 * which becomes the primary. When redistribution has not been enabled for the
 * provider the images stay previewable but cannot be selected.
 */
export function VehicleImageImport({
  images,
  enabled,
  selectedIds,
  primaryId,
  onChange,
  providerLabel,
}: {
  images: VehicleImportImage[];
  enabled: boolean;
  selectedIds: string[];
  primaryId: string | null;
  onChange: (next: { selectedIds: string[]; primaryId: string | null }) => void;
  providerLabel: string;
}) {
  const baseId = useId();

  if (images.length === 0) {
    return null;
  }

  function toggle(imageId: string, checked: boolean) {
    const nextSelected = checked
      ? [...selectedIds, imageId]
      : selectedIds.filter((id) => id !== imageId);

    const nextPrimary = checked
      ? (primaryId ?? imageId)
      : primaryId === imageId
        ? (nextSelected[0] ?? null)
        : primaryId;

    onChange({ selectedIds: nextSelected, primaryId: nextPrimary });
  }

  return (
    <section className="space-y-3" aria-labelledby={`${baseId}-heading`}>
      <div>
        <h2 id={`${baseId}-heading`} className="text-lg font-medium">
          {`Images from ${providerLabel}`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {enabled
            ? "Selected images are copied into Nii Plants storage when you save. You can still upload your own vehicle photos afterwards."
            : "Preview only. Copying these images into Nii Plants storage is turned off until image rights are confirmed with the provider. Upload your own vehicle photos after saving."}
        </p>
      </div>

      <input
        type="hidden"
        name="importImageIds"
        value={JSON.stringify(enabled ? selectedIds : [])}
        readOnly
      />
      <input
        type="hidden"
        name="primaryImportImageId"
        value={enabled ? (primaryId ?? "") : ""}
        readOnly
      />

      <ul className="grid gap-3 sm:grid-cols-3">
        {images.map((image) => {
          const checked = selectedIds.includes(image.providerImageId);
          const checkboxId = `${baseId}-select-${image.providerImageId}`;
          const angle = image.angle ? image.angle.replace(/-/g, " ") : "vehicle";

          return (
            <li
              key={image.providerImageId}
              className="space-y-2 rounded-xl bg-card p-2 ring-1 ring-border"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={image.previewUrl}
                  alt={`${providerLabel} ${angle} view`}
                  fill
                  unoptimized
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <label
                htmlFor={checkboxId}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  disabled={!enabled}
                  onChange={(event) =>
                    toggle(image.providerImageId, event.target.checked)
                  }
                />
                {`Import ${angle}`}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`${baseId}-primary`}
                  checked={primaryId === image.providerImageId}
                  disabled={!enabled || !checked}
                  onChange={() =>
                    onChange({ selectedIds, primaryId: image.providerImageId })
                  }
                />
                Primary
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
