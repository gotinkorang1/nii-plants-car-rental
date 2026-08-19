import { cn } from "@/lib/utils";

export type BookingStep = "trip" | "vehicle" | "details" | "payment";

const STEPS: { id: BookingStep; label: string }[] = [
  { id: "trip", label: "Trip" },
  { id: "vehicle", label: "Vehicle" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
];

export function BookingProgress({ current }: { current: BookingStep }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex flex-wrap gap-2 sm:gap-0">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 text-xs font-medium sm:text-sm",
                index < STEPS.length - 1 &&
                  cn(
                    "sm:after:mx-2 sm:after:h-px sm:after:flex-1 sm:after:content-['']",
                    done ? "sm:after:bg-primary" : "sm:after:bg-border",
                  ),
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background text-primary ring-2 ring-primary/20",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
                aria-hidden
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "truncate",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {step.label}
                {active ? <span className="sr-only"> (current step)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
