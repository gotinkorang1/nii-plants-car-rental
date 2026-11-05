import { AvailabilityResults } from "@/components/booking/availability-results";
import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { BookingSearchForm } from "@/components/booking/booking-search-form";
import { EmptyAvailability } from "@/components/booking/empty-availability";
import { TripSummary } from "@/components/booking/trip-summary";
import { BookingError } from "@/lib/booking/errors";
import { parseBookingSearchParams } from "@/lib/booking/search-params";
import { getPublicOfficePickupLocations } from "@/lib/content/queries";
import { getAvailableModels } from "@/lib/availability/get-available-models";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";
import {
  assertMinimumDuration,
  assertPickupNotInPast,
  availabilitySearchSchema,
} from "@/lib/validation/availability";

type PageProps = {
  searchParams: Promise<{
    pickup?: string;
    return?: string;
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
    vehicle?: string;
  }>;
};

export default async function BookVehicleResultsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locations = await getPublicOfficePickupLocations();
  const settings = await getSiteSettings();
  const contact = toPublicContact(settings);
  const raw = parseBookingSearchParams(params);
  const parsed = availabilitySearchSchema.safeParse(raw);

  if (!parsed.success) {
    return (
      <BookingPageShell
        step="vehicle"
        title="Choose your dates"
        lede="Enter pickup and return details to see available vehicles."
      >
        <BookingSearchForm
          locations={locations}
          defaults={raw}
          error={parsed.error.issues[0]?.message}
        />
      </BookingPageShell>
    );
  }

  try {
    assertPickupNotInPast(parsed.data.pickupAt);
    assertMinimumDuration(
      parsed.data.pickupAt,
      parsed.data.returnAt,
      settings.minimumRentalHours,
    );
  } catch (error) {
    return (
      <BookingPageShell
        step="vehicle"
        title="Choose your dates"
        lede="Enter pickup and return details to see available vehicles."
      >
        <BookingSearchForm
          locations={locations}
          defaults={parsed.data}
          error={error instanceof BookingError ? error.message : "Check the trip details."}
        />
      </BookingPageShell>
    );
  }

  const models = await getAvailableModels(parsed.data);
  const pickupName =
    locations.find((location) => location.slug === parsed.data.pickupLocation)?.name ??
    parsed.data.pickupLocation;
  const returnName =
    locations.find((location) => location.slug === parsed.data.returnLocation)?.name ??
    parsed.data.returnLocation;

  return (
    <BookingPageShell
      step="vehicle"
      eyebrow="Available vehicles"
      title="Choose a vehicle"
      lede="These models have capacity for your dates. You book a model or similar; staff assign the physical car."
      wide
    >
      <div className="max-w-3xl space-y-4">
        <TripSummary
          pickupName={pickupName}
          returnName={returnName}
          pickupDate={parsed.data.pickupDate}
          pickupTime={parsed.data.pickupTime}
          returnDate={parsed.data.returnDate}
          returnTime={parsed.data.returnTime}
        />
        <BookingSearchForm locations={locations} defaults={parsed.data} submitLabel="Update search" />
      </div>
      <div className="mt-10">
        {models.length === 0 ? (
          <EmptyAvailability
            locations={locations}
            search={parsed.data}
            phone={contact.phone}
            whatsapp={contact.whatsapp}
          />
        ) : (
          <AvailabilityResults models={models} search={parsed.data} />
        )}
      </div>
    </BookingPageShell>
  );
}
