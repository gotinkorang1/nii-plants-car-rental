import type { AvailabilitySearchInput } from "@/lib/validation/availability";

export function bookingSearchQuery(
  values: AvailabilitySearchInput,
  options: { includeVehicle?: boolean } = {},
): string {
  const params = new URLSearchParams();
  params.set("pickup", values.pickupLocation);
  if (values.returnLocation) {
    params.set("return", values.returnLocation);
  }
  params.set("pickupDate", values.pickupDate);
  params.set("pickupTime", values.pickupTime);
  params.set("returnDate", values.returnDate);
  params.set("returnTime", values.returnTime);
  if (options.includeVehicle !== false && values.vehicle) {
    params.set("vehicle", values.vehicle);
  }
  return params.toString();
}

export function parseBookingSearchParams(params: {
  pickup?: string;
  return?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  vehicle?: string;
}): AvailabilitySearchInput {
  return {
    pickupLocation: params.pickup ?? "",
    returnLocation: params.return ?? "",
    pickupDate: params.pickupDate ?? "",
    pickupTime: params.pickupTime ?? "",
    returnDate: params.returnDate ?? "",
    returnTime: params.returnTime ?? "",
    vehicle: params.vehicle,
  };
}
