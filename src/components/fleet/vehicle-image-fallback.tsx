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
        "flex h-full w-full flex-col justify-between bg-[linear-gradient(145deg,color-mix(in_oklch,var(--primary)_12%,var(--muted)),var(--muted))] p-5",
        className,
      )}
      role="img"
      aria-label={vehicleClass ? `${vehicleClass} — ${label}` : label}
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Nii Plants</p>
      <div>
        {vehicleClass ? (
          <p className="font-heading text-lg text-foreground">{vehicleClass}</p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
