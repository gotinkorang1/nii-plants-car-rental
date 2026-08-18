import {
  osmBrowseUrl,
  osmCopyrightUrl,
  osmEmbedUrl,
} from "@/lib/maps/openstreetmap";

export function OsmMapEmbed({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const embedUrl = osmEmbedUrl(latitude, longitude);
  const browseUrl = osmBrowseUrl(latitude, longitude);

  return (
    <figure className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <iframe
        title={`OpenStreetMap of ${name}`}
        src={embedUrl}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <figcaption className="space-y-1 px-4 py-3 text-sm text-muted-foreground">
        <p>{name}</p>
        <p>
          <a
            className="text-primary hover:underline"
            href={browseUrl}
            rel="noreferrer"
            target="_blank"
          >
            View {name} on OpenStreetMap
          </a>
          {" · "}
          <a
            className="text-primary hover:underline"
            href={osmCopyrightUrl()}
            rel="noreferrer"
            target="_blank"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
