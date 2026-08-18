import { getFleetMediaPublicUrl } from "@/lib/fleet/image-url";
import {
  assertNoInternalVehicleFields,
  type PublicVehicleImage,
  type PublicVehicleModel,
} from "@/lib/fleet/public-types";
import {
  vehicleClasses,
  vehicleImages,
  vehicleModels,
} from "@/lib/db/schema";
import { publicCustomFields } from "@/lib/validation/vehicle-custom-fields";

type ModelRow = typeof vehicleModels.$inferSelect;
type ClassRow = typeof vehicleClasses.$inferSelect;
type ImageRow = typeof vehicleImages.$inferSelect;

function toPublicImage(image: ImageRow): PublicVehicleImage {
  return {
    id: image.id,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    url: getFleetMediaPublicUrl(image.storagePath),
  };
}

export function toPublicVehicleModel(
  model: ModelRow,
  vehicleClass: ClassRow,
  images: ImageRow[],
): PublicVehicleModel {
  const mappedImages = [...images]
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        Number(right.isPrimary) - Number(left.isPrimary),
    )
    .map(toPublicImage);
  const primaryImage =
    mappedImages.find((image) => image.isPrimary) ?? mappedImages[0] ?? null;

  const publicModel: PublicVehicleModel = {
    id: model.id,
    slug: model.slug,
    make: model.make,
    modelName: model.model,
    description: model.description,
    seats: model.seats,
    doors: model.doors,
    transmission: model.transmission,
    fuelType: model.fuelType,
    luggage: model.luggage,
    airConditioning: model.airConditioning,
    featured: model.featured,
    yearFrom: model.yearFrom,
    yearTo: model.yearTo,
    className: vehicleClass.name,
    classSlug: vehicleClass.slug,
    dailyRatePesewas: vehicleClass.defaultDailyRate,
    primaryImage,
    images: mappedImages,

    bodyType: model.bodyType,
    trimLevel: model.trimLevel,
    engineName: model.engineName,
    engineDisplacementL: model.engineDisplacementL,
    powerKw: model.powerKw,
    driveType: model.driveType,
    fuelEconomyLPer100Km: model.fuelEconomyLPer100Km,
    batteryCapacityKwh: model.usableBatteryKwh ?? model.batteryCapacityKwh,
    evRangeKm: model.evRangeKm,
    acChargingKw: model.acChargingKw,
    dcChargingKw: model.dcChargingKw,

    // Drops internal rows and the flag itself, so nothing downstream can
    // accidentally render a private specification.
    customSpecs: publicCustomFields(model.customFields).map((field) => ({
      label: field.label,
      value: field.value,
    })),
  };

  assertNoInternalVehicleFields(publicModel);
  return publicModel;
}
