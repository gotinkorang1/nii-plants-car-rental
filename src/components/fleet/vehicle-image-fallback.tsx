import { VehicleSilhouette } from "@/components/fleet/vehicle-silhouette";
import { cn } from "@/lib/utils";

export function VehicleImageFallback({
  className,
  vehicleClass,
  label = "Image coming soon",
}: {
  className?: string;
  vehicleClass?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,color-mix(in_oklch,var(--primary)_16%,var(--muted)),var(--muted)_70%,color-mix(in_oklch,var(--accent)_10%,var(--muted)))] p-5",
        className,
      )}
      role="img"
      aria-label={vehicleClass ? `${vehicleClass} — ${label}` : label}
    >
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
        Nii Plants
      </p>
      <VehicleSilhouette
        vehicleClass={vehicleClass}
        className="pointer-events-none absolute inset-x-4 bottom-10 h-16 w-auto opacity-90"
      />
      <div className="relative">
        {vehicleClass ? (
          <p className="font-heading text-lg text-foreground">{vehicleClass}</p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
