export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

export function isProtectedAdminPath(pathname: string): boolean {
  return isAdminPath(pathname) && !isPublicAdminPath(pathname);
}

export function getSafeAdminRedirect(value: unknown): string {
  if (typeof value !== "string") {
    return "/admin";
  }

  const path = value.trim();

  if (!path.startsWith("/admin")) {
    return "/admin";
  }

  if (path.startsWith("//") || path.includes("\\") || path.includes("://")) {
    return "/admin";
  }

  if (isPublicAdminPath(path)) {
    return "/admin";
  }

  return path;
}
