import { locationTypeLabel } from "@/lib/content/location-type";

function googleMapsEmbedUrl(latitude: number, longitude: number, name: string) {
  const q = encodeURIComponent(`${latitude},${longitude}`);
  return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""}&q=${q}&zoom=15`;
}

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
  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);

  return (
    <figure className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {hasKey ? (
        <iframe
          title={`Map of ${name}`}
          src={googleMapsEmbedUrl(latitude, longitude, name)}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <iframe
          title={`Map of ${name}`}
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      )}
      <figcaption className="space-y-1 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{name}</span>
          {kind ? ` · ${kind}` : ""}
        </p>
        <p>
          <a
            className="text-primary hover:underline"
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
