const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

function youtubeEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function vimeoEmbed(id: string): string {
  return `https://player.vimeo.com/video/${id}`;
}

export function parseVideoEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0] ?? "";
    return YOUTUBE_ID.test(id) ? youtubeEmbed(id) : null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const fromQuery = url.searchParams.get("v") ?? "";
    if (YOUTUBE_ID.test(fromQuery)) {
      return youtubeEmbed(fromQuery);
    }

    const embedIndex = segments.indexOf("embed");
    const shortsIndex = segments.indexOf("shorts");
    const liveIndex = segments.indexOf("live");
    const candidate =
      (embedIndex >= 0 ? segments[embedIndex + 1] : undefined) ??
      (shortsIndex >= 0 ? segments[shortsIndex + 1] : undefined) ??
      (liveIndex >= 0 ? segments[liveIndex + 1] : undefined) ??
      "";

    return YOUTUBE_ID.test(candidate) ? youtubeEmbed(candidate) : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = segments.find((segment) => VIMEO_ID.test(segment));
    return id ? vimeoEmbed(id) : null;
  }

  return null;
}
