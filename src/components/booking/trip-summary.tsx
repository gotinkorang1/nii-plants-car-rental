import { CalendarDays, MapPin } from "lucide-react";

import {
  formatAccraDateLabel,
  previewHireDuration,
} from "@/lib/booking/hire-duration-preview";

export function TripSummary({
  pickupName,
  returnName,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}: {
  pickupName: string;
  returnName: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}) {
  const preview = previewHireDuration({
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
  });
  const samePlace = pickupName === returnName;
  const route = samePlace ? pickupName : `${pickupName} → ${returnName}`;
  const windowLabel = `${formatAccraDateLabel(pickupDate)} ${pickupTime} – ${formatAccraDateLabel(returnDate)} ${returnTime}`;

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border-l-2 border-accent bg-primary/5 px-4 py-3 text-sm ring-1 ring-primary/15">
      <span className="flex items-center gap-1.5 font-medium">
        <MapPin className="size-3.5 shrink-0 text-accent" />
        {route}
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarDays className="size-3.5 shrink-0 text-accent" />
        {windowLabel}
        {preview.status === "ready"
          ? ` · ${preview.days} chargeable ${preview.days === 1 ? "day" : "days"}`
          : ""}
      </span>
    </div>
  );
}
