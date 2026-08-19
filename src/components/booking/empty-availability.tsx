import Link from "next/link";

import { BookingSearchForm } from "@/components/booking/booking-search-form";
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
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border sm:p-8">
      <h2 className="font-heading text-2xl">No vehicles are available for these dates.</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Try a different pickup day, a shorter hire, or another location. Staff can
        also check chauffeur or airport options.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {phone ? (
          <Button asChild>
            <a href={telHref(phone)}>Call</a>
          </Button>
        ) : null}
        {whatsapp ? (
          <Button asChild variant="outline">
            <a href={whatsappHref(whatsapp)}>WhatsApp</a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/book">Change dates</Link>
        </Button>
      </div>
      <div className="mt-8">
        <BookingSearchForm locations={locations} defaults={search} submitLabel="Search again" />
      </div>
    </div>
  );
}
