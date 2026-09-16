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
      <div
        className="relative mb-3 h-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label="Booking progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={`${STEPS[currentIndex]?.label ?? "Booking"} step of ${STEPS.length}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ol className="grid grid-cols-4 gap-1 sm:flex sm:gap-0">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 text-center text-xs font-medium sm:flex-1 sm:flex-row sm:items-center sm:gap-2 sm:text-left sm:text-sm",
                "transition-colors duration-300",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  "transition-all duration-500",
                  done && "border-accent bg-accent text-accent-foreground scale-100",
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
