import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { BookingSearchForm } from "@/components/booking/booking-search-form";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { getPublicLocations } from "@/lib/content/queries";
import { marketingImages } from "@/lib/content/marketing-images";
import { parseBookingSearchParams } from "@/lib/booking/search-params";
import { utcToAccraDateInput } from "@/lib/booking/timezone";

type PageProps = {
  searchParams: Promise<{
    vehicle?: string;
    pickup?: string;
    return?: string;
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
  }>;
};

function defaultSearchDates() {
  const pickup = new Date();
  pickup.setUTCDate(pickup.getUTCDate() + 1);
  pickup.setUTCHours(10, 0, 0, 0);
  const dropoff = new Date(pickup);
  dropoff.setUTCDate(dropoff.getUTCDate() + 1);
  return {
    pickupDate: utcToAccraDateInput(pickup),
    pickupTime: "10:00",
    returnDate: utcToAccraDateInput(dropoff),
    returnTime: "10:00",
  };
}

export default async function BookSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locations = await getPublicLocations();
  const parsed = parseBookingSearchParams(params);
  const dates = defaultSearchDates();
  const defaults = {
    ...dates,
    ...parsed,
    pickupDate: parsed.pickupDate || dates.pickupDate,
    pickupTime: parsed.pickupTime || dates.pickupTime,
    returnDate: parsed.returnDate || dates.returnDate,
    returnTime: parsed.returnTime || dates.returnTime,
  };

  return (
    <BookingPageShell
      step="trip"
      eyebrow="Self-drive booking"
      title="Choose your dates"
      lede="Availability is checked against physical vehicles. Chauffeur, airport transfer, and other services remain enquiry-based."
    >
      <MarketingPhoto
        image={marketingImages.selfDrive}
        className="mb-8 aspect-[16/7] rounded-2xl"
        sizes="(max-width: 768px) 100vw, 48rem"
        objectPosition="center 35%"
      />
      <BookingSearchForm locations={locations} defaults={defaults} />
    </BookingPageShell>
  );
}
