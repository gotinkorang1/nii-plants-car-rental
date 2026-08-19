"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shouldHidePublicActionBar } from "@/lib/content/public-nav";
import {
  telHref,
  whatsappHref,
  type PublicContact,
} from "@/lib/settings/public-contact";
import { cn } from "@/lib/utils";

export function PublicActionBar({ contact }: { contact: PublicContact }) {
  const pathname = usePathname();
  const hidden = shouldHidePublicActionBar(pathname);

  if (hidden) {
    return null;
  }

  const hasWhatsapp = Boolean(contact.whatsapp);
  const hasPhone = Boolean(contact.phone);

  return (
    <>
      <div className="h-20 sm:hidden" aria-hidden />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 p-3 shadow-[0_-8px_30px_rgba(24,26,24,0.08)] backdrop-blur-md",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden sm:hidden",
        )}
      >
        <div className="mx-auto flex max-w-6xl gap-2">
          {hasWhatsapp ? (
            <Button asChild variant="outline" size="lg" className="flex-1">
              <a href={whatsappHref(contact.whatsapp ?? "")}>WhatsApp</a>
            </Button>
          ) : hasPhone ? (
            <Button asChild variant="outline" size="lg" className="flex-1">
              <a href={telHref(contact.phone ?? "")}>Call</a>
            </Button>
          ) : null}
          <Button asChild size="lg" className="flex-1">
            <Link href="/book">Book a Vehicle</Link>
          </Button>
        </div>
      </div>
      {hasPhone || hasWhatsapp ? (
        <nav
          aria-label="Quick contact"
          className="fixed right-4 bottom-6 z-30 hidden flex-col gap-2 print:hidden lg:flex"
        >
          {hasPhone ? (
            <Button
              asChild
              size="icon-lg"
              className="rounded-full shadow-lg"
            >
              <a href={telHref(contact.phone ?? "")} aria-label={`Call ${contact.phone}`}>
                <Phone />
              </a>
            </Button>
          ) : null}
          {hasWhatsapp ? (
            <Button
              asChild
              size="icon-lg"
              variant="secondary"
              className="rounded-full shadow-lg ring-1 ring-border"
            >
              <a href={whatsappHref(contact.whatsapp ?? "")} aria-label="WhatsApp">
                <MessageCircle />
              </a>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
