const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "br",
  "blockquote",
]);

export function sanitizeCmsHtml(input: string): string {
  const withoutDangerous = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(iframe|object|embed|link|meta|form|input)[^>]*>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\son\w+=\S+/gi, "");

  return withoutDangerous.replace(
    /<\/?([a-z0-9]+)(\s[^>]*)?>/gi,
    (full, rawTag: string, rawAttrs: string = "") => {
      const tag = rawTag.toLowerCase();
      const closing = full.startsWith("</");
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }
      if (closing || tag === "br") {
        return closing ? `</${tag}>` : "<br>";
      }
      if (tag === "a") {
        const href = readHref(rawAttrs);
        if (!href) {
          return "<a>";
        }
        return `<a href="${href}">`;
      }
      return `<${tag}>`;
    },
  );
}

function readHref(attrs: string): string | null {
  const match = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
  const href = match?.[2] ?? match?.[3] ?? "";
  if (
    href.startsWith("/") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    if (/^javascript:/i.test(href) || /^data:/i.test(href)) {
      return null;
    }
    return href.replaceAll('"', "");
  }
  return null;
}
