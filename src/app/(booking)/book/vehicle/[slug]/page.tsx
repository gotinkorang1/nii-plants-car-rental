import { notFound } from "next/navigation";

import { BookingProgress } from "@/components/booking/booking-progress";
import { ExtrasAndQuoteForm } from "@/components/booking/extras-form";
import { parseBookingSearchParams } from "@/lib/booking/search-params";
import { getAvailableModels } from "@/lib/availability/get-available-models";
import { getPublicModel } from "@/lib/fleet/get-public-model";
import { listActiveExtras } from "@/lib/pricing/queries";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import {
  assertMinimumDuration,
  assertPickupNotInPast,
  availabilitySearchSchema,
} from "@/lib/validation/availability";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    pickup?: string;
    return?: string;
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
    error?: string;
  }>;
};

export default async function BookVehicleExtrasPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  // Keep these reads sequential. Transaction-mode Supavisor can leave
  // concurrent server-component reads pending while the page is streamed,
  // which makes the booking step appear frozen.
  const model = await getPublicModel(slug);
  const extras = await listActiveExtras();
  const settings = await getSiteSettings();

  if (!model) {
    notFound();
  }

  const parsed = availabilitySearchSchema.safeParse(parseBookingSearchParams(query));
  if (!parsed.success) {
    notFound();
  }

  assertPickupNotInPast(parsed.data.pickupAt);
  assertMinimumDuration(
    parsed.data.pickupAt,
    parsed.data.returnAt,
    settings.minimumRentalHours,
  );

  const available = await getAvailableModels(parsed.data);
  const match = available.find((item) => item.slug === model.slug);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <BookingProgress current="vehicle" />
      <ExtrasAndQuoteForm
        search={{
          pickupLocation: parsed.data.pickupLocation,
          returnLocation: parsed.data.returnLocation,
          pickupDate: parsed.data.pickupDate,
          pickupTime: parsed.data.pickupTime,
          returnDate: parsed.data.returnDate,
          returnTime: parsed.data.returnTime,
          pickupAt: parsed.data.pickupAt.toISOString(),
          returnAt: parsed.data.returnAt.toISOString(),
        }}
        modelSlug={model.slug}
        modelName={`${model.make} ${model.modelName}`}
        className={model.className}
        dailyRate={match?.dailyRate ?? model.dailyRatePesewas}
        securityDepositRequired={match?.securityDepositRequired ?? 0}
        reservationPaymentPercent={settings.reservationPaymentPercent}
        extras={extras}
        error={
          match
            ? undefined
            : "That vehicle was just reserved for these dates. Please choose another available option."
        }
      />
    </main>
  );
}
