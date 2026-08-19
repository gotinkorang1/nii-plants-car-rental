export const PUBLIC_PRIMARY_LINKS = [
  { href: "/fleet", label: "Fleet" },
  { href: "/services", label: "Services" },
  { href: "/corporate", label: "Corporate" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
] as const;

export const PUBLIC_FOOTER_EXPLORE_LINKS = [
  { href: "/fleet", label: "Fleet" },
  { href: "/services", label: "Services" },
  { href: "/corporate", label: "Corporate" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
] as const;

export const PUBLIC_FOOTER_BOOK_LINKS = [
  { href: "/book", label: "Check availability" },
  { href: "/help/requirements", label: "Rental requirements" },
  { href: "/help/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
] as const;

export function isPublicNavCurrent(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function shouldHidePublicActionBar(pathname: string): boolean {
  return (
    pathname.startsWith("/book") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/payment")
  );
}
