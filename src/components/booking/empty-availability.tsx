import Link from "next/link";
import { CalendarDays, MessageCircle, Phone } from "lucide-react";

import { BookingSearchForm } from "@/components/booking/booking-search-form";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { Button } from "@/components/ui/button";
import type { PublicSearchLocation } from "@/lib/content/location-type";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";
import { telHref, whatsappHref } from "@/lib/settings/public-contact";

export function EmptyAvailability({
  locations,
  search,
  phone,
  whatsapp,
}: {
  locations: PublicSearchLocation[];
  search: AvailabilitySearchInput;
  phone?: string;
  whatsapp?: string;
}) {
  return (
    <DeskPanel bodyClassName="p-6 sm:p-8">
      <h2 className="font-heading text-2xl">No vehicles are available for these dates.</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Try a different pickup day, a shorter hire, or another location. Staff can
        also check chauffeur or airport options.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {phone ? (
          <Button asChild size="lg" className="h-11 px-4">
            <a href={telHref(phone)}>
              <Phone className="size-4" />
              Call
            </a>
          </Button>
        ) : null}
        {whatsapp ? (
          <Button asChild variant="outline" size="lg" className="h-11 px-4">
            <a href={whatsappHref(whatsapp)}>
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href="/book">
            <CalendarDays className="size-4" />
            Change dates
          </Link>
        </Button>
      </div>
      <div className="mt-8">
        <BookingSearchForm locations={locations} defaults={search} submitLabel="Search again" />
      </div>
    </DeskPanel>
  );
}
