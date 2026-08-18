const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function requireSlug(value: string, fallbackName?: string): string {
  const fromValue = slugify(value);
  if (fromValue.length > 0 && isValidSlug(fromValue)) {
    return fromValue;
  }

  if (fallbackName) {
    const fromName = slugify(fallbackName);
    if (fromName.length > 0) {
      return fromName;
    }
  }

  throw new Error("A URL slug is required.");
}
