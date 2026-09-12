import { MapPin } from "lucide-react";

import { locationTypeLabel } from "@/lib/content/location-type";

function googleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function GoogleMapEmbed({
  latitude,
  longitude,
  name,
  type,
}: {
  latitude: number;
  longitude: number;
  name: string;
  type?: string | null;
}) {
  const kind = locationTypeLabel(type);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  return (
    <figure className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {key ? (
        <iframe
          title={`Map of ${name}`}
          src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${latitude},${longitude}&zoom=15`}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <a
          href={googleMapsUrl(latitude, longitude)}
          target="_blank"
          rel="noreferrer"
          className="flex h-64 w-full flex-col items-center justify-center gap-3 bg-muted/50 transition-colors hover:bg-muted"
        >
          <MapPin className="size-10 text-accent" />
          <span className="text-sm font-medium text-foreground">
            View {name} on Google Maps
          </span>
          <span className="text-xs text-muted-foreground">
            Click to open in a new tab
          </span>
        </a>
      )}
      <figcaption className="space-y-1 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{name}</span>
          {kind ? ` · ${kind}` : ""}
        </p>
        <p>
          <a
            className="text-accent hover:underline"
            href={googleMapsUrl(latitude, longitude)}
            rel="noreferrer"
            target="_blank"
          >
            Open in Google Maps
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
