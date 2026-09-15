export const RESERVED_PUBLIC_SLUGS = [
  "admin",
  "api",
  "book",
  "booking",
  "fleet",
  "services",
  "corporate",
  "about",
  "news",
  "gallery",
  "help",
  "contact",
  "privacy",
  "terms",
  "login",
  "payment",
  "payments",
  "webhooks",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "_next",
] as const;

export function isReservedPublicSlug(slug: string): boolean {
  const first = slug.trim().toLowerCase().split("/")[0] ?? "";
  return (RESERVED_PUBLIC_SLUGS as readonly string[]).includes(first);
}
