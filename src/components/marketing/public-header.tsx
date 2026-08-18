"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mailHref,
  telHref,
  whatsappHref,
  type PublicContact,
} from "@/lib/settings/public-contact";

const primaryLinks = [
  { href: "/fleet", label: "Fleet" },
  { href: "/services", label: "Services" },
  { href: "/corporate", label: "Corporate" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
] as const;

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
};

export function PublicHeader({ contact }: { contact: PublicContact }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  function isCurrent(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg tracking-tight text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Nii Plants
        </Link>
        <nav
          aria-label="Primary"
          className="ml-4 hidden items-center gap-1 lg:flex"
        >
          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground hover:text-primary",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isCurrent(item.href) && "text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {contact.phone ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href={telHref(contact.phone)}>Call</a>
            </Button>
          ) : null}
          {contact.whatsapp ? (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href={whatsappHref(contact.whatsapp)}>WhatsApp</a>
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link href="/book">Book a Vehicle</Link>
          </Button>
          <Button
            ref={menuButtonRef}
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </Button>
        </div>
      </div>
      {open ? (
        <div
          id={menuId}
          className="border-t border-border bg-background px-4 py-4 lg:hidden"
        >
          <nav aria-label="Mobile" className="grid gap-1">
            {primaryLinks.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                onClick={closeMenu}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isCurrent(item.href) && "bg-muted text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              aria-current={isCurrent("/contact") ? "page" : undefined}
              onClick={closeMenu}
              className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Contact
            </Link>
            <div className="mt-2 grid gap-1 border-t border-border pt-3">
              {contact.phone ? (
                <a
                  href={telHref(contact.phone)}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Call {contact.phone}
                </a>
              ) : null}
              {contact.whatsapp ? (
                <a
                  href={whatsappHref(contact.whatsapp)}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  WhatsApp
                </a>
              ) : null}
              {contact.email ? (
                <a
                  href={mailHref(contact.email)}
                  onClick={closeMenu}
                  className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Email
                </a>
              ) : null}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter({ contact }: { contact: PublicContact }) {
  const social = Object.entries(contact.socialLinks).filter(
    ([, value]) => Boolean(value),
  );

  return (
    <footer className="mt-auto border-t border-border/80 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <p className="font-heading text-lg">Nii Plants</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Self-drive and chauffeur car rental in Accra since 2007. GTA
            car-rental awards in 2022 and 2024.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Explore</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/fleet" className="hover:text-primary">
                Fleet
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-primary">
                Services
              </Link>
            </li>
            <li>
              <Link href="/corporate" className="hover:text-primary">
                Corporate
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-primary">
                Help
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Book</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/book" className="hover:text-primary">
                Check availability
              </Link>
            </li>
            <li>
              <Link href="/help/requirements" className="hover:text-primary">
                Rental requirements
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">{contact.businessName}</p>
          {contact.phone ? (
            <p className="mt-2">
              <a href={telHref(contact.phone)}>{contact.phone}</a>
            </p>
          ) : null}
          {contact.email ? (
            <p className="mt-1">
              <a href={mailHref(contact.email)}>{contact.email}</a>
            </p>
          ) : null}
          {contact.address ? <p className="mt-1 text-muted-foreground">{contact.address}</p> : null}
          {social.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-3">
              {social.map(([name, href]) => (
                <li key={name}>
                  <a href={href} className="hover:text-primary">
                    {SOCIAL_LABELS[name] ?? name}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
