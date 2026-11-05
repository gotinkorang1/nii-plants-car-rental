"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Menu, MessageCircle, Phone, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/content/company";
import {
  isPublicNavCurrent,
  PUBLIC_FOOTER_BOOK_LINKS,
  PUBLIC_FOOTER_EXPLORE_LINKS,
  PUBLIC_FOOTER_LEGAL_LINKS,
  PUBLIC_PRIMARY_LINKS,
} from "@/lib/content/public-nav";
import { cn } from "@/lib/utils";
import {
  mailHref,
  telHref,
  whatsappHref,
  type PublicContact,
} from "@/lib/settings/public-contact";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
};

export function PublicHeader({ contact }: { contact: PublicContact }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuOpen = open && menuPath === pathname;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !menuPanelRef.current) {
        return;
      }

      const focusable = Array.from(
        menuPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  const homeTop = pathname === "/" && !scrolled;

  return (
    <>
      <header
        className={cn(
          "site-header relative z-50 isolate flex-none sticky top-0 border-b transition-[background-color,box-shadow,border-color,color] duration-300",
          homeTop ? "border-transparent bg-transparent" : "backdrop-blur-md",
          !homeTop && scrolled
            ? "border-border/80 bg-background/90 shadow-[0_8px_24px_rgba(24,26,24,0.06)]"
            : !homeTop
              ? "border-transparent bg-background/70"
              : null,
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <BrandLogo className="h-11 w-auto sm:h-12" />
          </Link>
          <nav
            aria-label="Primary"
            className="ml-6 hidden items-center gap-0.5 lg:flex"
          >
            {PUBLIC_PRIMARY_LINKS.map((item) => {
              const current = isPublicNavCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    "after:absolute after:inset-x-2 after:-bottom-0.5 after:block after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 after:content-['']",
                    "hover:after:scale-x-100",
                    homeTop
                      ? "text-white/85 hover:text-white"
                      : "text-foreground/80 hover:text-primary",
                    current &&
                      (homeTop
                        ? "text-white after:scale-x-100"
                        : "text-primary after:scale-x-100"),
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {contact.phone ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "hidden sm:inline-flex",
                  homeTop && "text-white hover:bg-white/10 hover:text-white",
                )}
              >
                <a href={telHref(contact.phone)}>Call</a>
              </Button>
            ) : null}
            {contact.whatsapp ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "hidden md:inline-flex",
                  homeTop && "text-white hover:bg-white/10 hover:text-white",
                )}
              >
                <a href={whatsappHref(contact.whatsapp)}>WhatsApp</a>
              </Button>
            ) : null}
            <Button asChild size="sm" className="hidden shrink-0 sm:inline-flex">
              <Link href="/book">Book a Vehicle</Link>
            </Button>
            <Button
              ref={menuButtonRef}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "lg:hidden",
                "min-h-11 min-w-11 shrink-0 touch-manipulation",
                homeTop &&
                  "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              )}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-haspopup="dialog"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => {
                if (menuOpen) {
                  setOpen(false);
                } else {
                  setMenuPath(pathname);
                  setOpen(true);
                }
              }}
            >
              {menuOpen ? (
                <X aria-hidden className="size-3.5" />
              ) : (
                <Menu aria-hidden className="size-3.5" />
              )}
              {open ? "Close" : "Menu"}
            </Button>
          </div>
        </div>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-[95] isolate overscroll-contain lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[#181a18]/40 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
          <div
            ref={menuPanelRef}
            id={menuId}
            data-testid="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="marketing-page-enter absolute inset-x-0 top-16 flex max-h-[calc(100dvh-4rem)] min-h-[calc(100dvh-4rem)] w-full flex-col overflow-y-auto overscroll-contain border-t border-border bg-background px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:left-auto sm:max-w-sm sm:border-l sm:border-t-0"
          >
            <nav aria-label="Mobile" className="grid gap-1">
              {PUBLIC_PRIMARY_LINKS.map((item, index) => {
                const current = isPublicNavCurrent(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={closeMenu}
                    className={cn(
                      "min-h-11 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      current && "bg-muted text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-3 grid gap-2 border-t border-border pt-4">
                {contact.phone ? (
                  <a
                    href={telHref(contact.phone)}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Phone className="size-4" />
                    Call {contact.phone}
                  </a>
                ) : null}
                {contact.whatsapp ? (
                  <a
                    href={whatsappHref(contact.whatsapp)}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                ) : null}
                {contact.email ? (
                  <a
                    href={mailHref(contact.email)}
                    onClick={closeMenu}
                    className="min-h-11 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    Email
                  </a>
                ) : null}
                <Button asChild size="lg" className="mt-1">
                  <Link href="/book" onClick={closeMenu}>
                    <CalendarCheck className="size-4" />
                    Book a Vehicle
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PublicFooter({ contact }: { contact: PublicContact }) {
  const social = Object.entries(contact.socialLinks).filter(([, value]) =>
    Boolean(value),
  );

  return (
    <footer className="mt-auto border-t border-border/80 bg-[linear-gradient(180deg,#fbf8f2_0%,#f7f3eb_100%)]">
      <div className="h-0.5 w-full bg-[linear-gradient(90deg,transparent,var(--accent),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <BrandLogo className="h-16 w-auto" />
          <p className="mt-2 text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {COMPANY.tagline}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Self-drive and chauffeur car rental in Accra since 2007. GTA
            car-rental awards in 2022 and 2024.
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="h-px w-5 bg-accent" aria-hidden />
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {PUBLIC_FOOTER_EXPLORE_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <span className="h-px w-5 bg-accent" aria-hidden />
            Book
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {PUBLIC_FOOTER_BOOK_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">{contact.businessName}</p>
          <p className="mt-2 text-muted-foreground">{COMPANY.openingHoursDisplay}</p>
          {contact.phone ? (
            <p className="mt-2">
              <a className="hover:text-primary" href={telHref(contact.phone)}>
                {contact.phone}
              </a>
            </p>
          ) : null}
          {contact.email ? (
            <p className="mt-1">
              <a className="hover:text-primary" href={mailHref(contact.email)}>
                {contact.email}
              </a>
            </p>
          ) : null}
          {contact.address ? (
            <p className="mt-1 text-muted-foreground">{contact.address}</p>
          ) : null}
          {social.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {social.map(([name, href]) => (
                <li key={name}>
                  <a href={href} className="text-muted-foreground hover:text-primary">
                    {SOCIAL_LABELS[name] ?? name}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4 text-sm sm:px-6">
          <p className="text-muted-foreground">
            © {COMPANY.foundedYear}–{new Date().getFullYear()} {COMPANY.legalName}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:ms-auto">
            {PUBLIC_FOOTER_LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
