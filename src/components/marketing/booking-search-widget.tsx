import { BookingSearchForm } from "@/components/booking/booking-search-form";

export function BookingSearchWidget({
  locations,
}: {
  locations: { slug: string; name: string; type?: string }[];
}) {
  return <BookingSearchForm locations={locations} />;
}
