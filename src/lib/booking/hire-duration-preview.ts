import { accraDateTimeToUtc, isValidClockTime, isValidIsoDate } from "@/lib/booking/timezone";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";

export type HireDurationPreview =
  | { status: "incomplete" }
  | { status: "invalid" }
  | { status: "order" }
  | { status: "ready"; days: number };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function previewHireDuration(input: {
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
}): HireDurationPreview {
  const pickupDate = input.pickupDate?.trim() ?? "";
  const pickupTime = input.pickupTime?.trim() ?? "";
  const returnDate = input.returnDate?.trim() ?? "";
  const returnTime = input.returnTime?.trim() ?? "";

  if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
    return { status: "incomplete" };
  }

  if (
    !isValidIsoDate(pickupDate) ||
    !isValidClockTime(pickupTime) ||
    !isValidIsoDate(returnDate) ||
    !isValidClockTime(returnTime)
  ) {
    return { status: "invalid" };
  }

  const pickupAt = accraDateTimeToUtc(pickupDate, pickupTime);
  const returnAt = accraDateTimeToUtc(returnDate, returnTime);

  if (pickupAt.getTime() >= returnAt.getTime()) {
    return { status: "order" };
  }

  return {
    status: "ready",
    days: calculateChargeableDays(pickupAt, returnAt),
  };
}

export function hireDurationMessage(preview: HireDurationPreview): string {
  switch (preview.status) {
    case "incomplete":
      return "24-hour hire days · travel inside Ghana";
    case "invalid":
      return "Enter a valid pickup and return date.";
    case "order":
      return "Return must be after pickup.";
    case "ready":
      return preview.days === 1
        ? "This hire is 1 chargeable day · travel inside Ghana"
        : `This hire is ${preview.days} chargeable days · travel inside Ghana`;
  }
}

export function formatAccraDateLabel(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
