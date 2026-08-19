import { BookingProgress, type BookingStep } from "@/components/booking/booking-progress";
import { cn } from "@/lib/utils";

export function BookingPageShell({
  step,
  eyebrow,
  title,
  lede,
  children,
  wide = false,
}: {
  step: BookingStep;
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full flex-1 px-4 py-10 sm:px-6 sm:py-12",
        wide ? "max-w-6xl" : "max-w-3xl",
      )}
    >
      <BookingProgress current={step} />
      {eyebrow ? (
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-heading text-3xl tracking-tight sm:text-4xl",
          eyebrow ? "mt-2" : undefined,
        )}
      >
        {title}
      </h1>
      {lede ? (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {lede}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </main>
  );
}
