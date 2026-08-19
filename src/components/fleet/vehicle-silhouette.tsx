import { vehicleClassKind } from "@/lib/fleet/vehicle-class-kind";
import { cn } from "@/lib/utils";

const paths = {
  sedan:
    "M18 44h8c2-8 8-16 18-18l10-10h42l12 10c8 2 14 8 16 18h8v8h-8c0 6-5 10-11 10s-11-4-11-10H37c0 6-5 10-11 10s-11-4-11-10H18zm19 8a6 6 0 1 0 0-12 6 6 0 0 0 0 12m58 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12M44 20h36l8 8H38z",
  suv: "M16 46h8c2-9 8-16 20-18V16h48l14 12c8 2 14 8 16 18h8v8h-8c0 6-5 10-11 10s-11-4-11-10H45c0 6-5 10-11 10s-11-4-11-10H16zm29 8a6 6 0 1 0 0-12 6 6 0 0 0 0 12m52 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12M48 20h36v8H48z",
  offroad:
    "M14 48h10c2-8 6-14 16-16l8-14h40l16 14c10 2 16 8 18 16h8v8h-8c0 7-6 12-13 12s-13-5-13-12H48c0 7-6 12-13 12s-13-5-13-12H14zm21 8a8 8 0 1 0 0-16 8 8 0 0 0 0 16m62 0a8 8 0 1 0 0-16 8 8 0 0 0 0 16M52 22h32l10 10H44z",
  van: "M18 22h52l28 20c4 2 8 6 10 12h8v8h-8c0 6-5 10-11 10s-11-4-11-10H47c0 6-5 10-11 10s-11-4-11-10H18zm18 34a6 6 0 1 0 0-12 6 6 0 0 0 0 12m58 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12M26 28h40v12H26z",
  coach:
    "M12 24h92c8 0 14 6 16 14v16h-8c0 6-5 10-11 10s-11-4-11-10H42c0 6-5 10-11 10s-11-4-11-10H12zm19 34a6 6 0 1 0 0-12 6 6 0 0 0 0 12m62 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12M24 30h16v12H24zm24 0h16v12H48zm24 0h16v12H72z",
  other:
    "M20 44h8c2-8 8-16 18-18l8-8h48l10 8c8 2 14 8 16 18h8v8h-8c0 6-5 10-11 10s-11-4-11-10H39c0 6-5 10-11 10s-11-4-11-10H20zm19 8a6 6 0 1 0 0-12 6 6 0 0 0 0 12m58 0a6 6 0 1 0 0-12 6 6 0 0 0 0 12",
} as const;

export function VehicleSilhouette({
  vehicleClass,
  className,
}: {
  vehicleClass?: string;
  className?: string;
}) {
  const kind = vehicleClassKind(vehicleClass);

  return (
    <svg
      aria-hidden
      viewBox="0 0 140 72"
      className={cn("text-primary/45", className)}
    >
      <path d={paths[kind]} fill="currentColor" />
    </svg>
  );
}
