import { BookingSearchForm } from "@/components/booking/booking-search-form";
import type { PublicSearchLocation } from "@/lib/content/location-type";

export function BookingSearchWidget({
  locations,
}: {
  locations: PublicSearchLocation[];
}) {
  return <BookingSearchForm locations={locations} compact />;
}
