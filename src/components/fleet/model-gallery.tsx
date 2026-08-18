"use client";

import Image from "next/image";
import { useState } from "react";

import type { PublicVehicleImage } from "@/lib/fleet/public-types";

export function ModelGallery({
  heading,
  images,
}: {
  heading: string;
  images: PublicVehicleImage[];
}) {
  const visible = images.filter((image) => image.url);
  const [activeId, setActiveId] = useState(visible[0]?.id);
  const active = visible.find((image) => image.id === activeId) ?? visible[0];

  if (!active?.url) {
    return (
      <div className="flex aspect-[4/3] items-end rounded-2xl bg-muted p-6">
        <p className="text-sm text-muted-foreground">
          Photographs for this model have not been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={active.url}
          alt={active.altText}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {visible.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto" aria-label={`${heading} photographs`}>
          {visible.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-pressed={image.id === active.id}
                className="relative size-16 overflow-hidden rounded-lg ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-primary"
              >
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.altText}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
