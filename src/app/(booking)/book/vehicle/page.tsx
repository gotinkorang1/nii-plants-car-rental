import { AvailabilityResults } from "@/components/booking/availability-results";
import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { BookingSearchForm } from "@/components/booking/booking-search-form";
import { EmptyAvailability } from "@/components/booking/empty-availability";
import { BookingError } from "@/lib/booking/errors";
import { parseBookingSearchParams } from "@/lib/booking/search-params";
import { getPublicLocations } from "@/lib/content/queries";
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
  const [locations, settings] = await Promise.all([
    getPublicLocations(),
    getSiteSettings(),
  ]);
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

  return (
    <BookingPageShell
      step="vehicle"
      eyebrow="Available vehicles"
      title="Choose a vehicle"
      lede={`Showing models with capacity for ${parsed.data.pickupDate} ${parsed.data.pickupTime} to ${parsed.data.returnDate} ${parsed.data.returnTime}.`}
      wide
    >
      <div className="max-w-3xl">
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
