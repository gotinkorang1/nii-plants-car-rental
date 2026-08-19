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
  const progressPercent = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <div className="relative mb-3 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-2 sm:gap-0">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 text-xs font-medium sm:text-sm",
                "transition-colors duration-300",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  "transition-all duration-500",
                  done && "border-primary bg-primary text-primary-foreground scale-100",
                  active &&
                    "border-accent bg-background text-primary ring-2 ring-accent/35 scale-110",
                  !done && !active && "border-border bg-background text-muted-foreground scale-100",
                )}
                aria-hidden
              >
                {done ? (
                  <svg className="size-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 7.5L5.5 11L12 3" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "truncate transition-colors duration-300",
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
