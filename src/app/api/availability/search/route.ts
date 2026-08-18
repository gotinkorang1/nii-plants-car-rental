import { NextResponse } from "next/server";

import { BookingError } from "@/lib/booking/errors";
import { getAvailableModels } from "@/lib/availability/get-available-models";
import { log } from "@/lib/logger";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import {
  assertMinimumDuration,
  assertPickupNotInPast,
  availabilitySearchSchema,
} from "@/lib/validation/availability";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send a JSON availability search." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid search payload." }, { status: 400 });
  }

  const parsed = availabilitySearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the trip details." },
      { status: 400 },
    );
  }

  try {
    const settings = await getSiteSettings();
    assertPickupNotInPast(parsed.data.pickupAt);
    assertMinimumDuration(
      parsed.data.pickupAt,
      parsed.data.returnAt,
      settings.minimumRentalHours,
    );

    const models = await getAvailableModels(parsed.data);

    log("info", "availability_search", {
      source: "api",
      resultCount: models.length,
    });

    return NextResponse.json({
      chargeableDays: models[0]?.chargeableDays ?? null,
      models: models.map((model) => ({
        modelId: model.modelId,
        classId: model.classId,
        make: model.make,
        model: model.model,
        slug: model.slug,
        className: model.className,
        seats: model.seats,
        luggage: model.luggage,
        transmission: model.transmission,
        airConditioning: model.airConditioning,
        image: model.image,
        dailyRate: model.dailyRate,
        estimatedTotal: model.estimatedTotal,
      })),
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Availability could not be checked." },
      { status: 500 },
    );
  }
}
