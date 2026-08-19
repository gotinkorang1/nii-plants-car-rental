"use client";

import Image from "next/image";
import { useState } from "react";

import { VehicleImageFallback } from "@/components/fleet/vehicle-image-fallback";
import type { PublicVehicleImage } from "@/lib/fleet/public-types";
import { cn } from "@/lib/utils";

export function ModelGallery({
  heading,
  images,
  vehicleClass,
}: {
  heading: string;
  images: PublicVehicleImage[];
  vehicleClass?: string;
}) {
  const visible = images.filter((image) => image.url);
  const [activeId, setActiveId] = useState(visible[0]?.id);
  const active = visible.find((image) => image.id === activeId) ?? visible[0];

  if (!active?.url) {
    return (
      <VehicleImageFallback
        vehicleClass={vehicleClass}
        className="aspect-[4/3] min-h-72 rounded-2xl"
        label="Photographs for this model have not been published yet."
      />
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
                className={cn(
                  "relative size-16 overflow-hidden rounded-lg ring-1 ring-border transition-transform duration-200",
                  "hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
                  "aria-pressed:ring-2 aria-pressed:ring-primary motion-reduce:transition-none motion-reduce:hover:scale-100",
                )}
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
