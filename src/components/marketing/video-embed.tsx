import { parseVideoEmbedUrl } from "@/lib/content/video-embed";

export function VideoEmbed({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const embed = parseVideoEmbedUrl(url);
  if (!embed) {
    return null;
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
      <iframe
        src={embed}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
