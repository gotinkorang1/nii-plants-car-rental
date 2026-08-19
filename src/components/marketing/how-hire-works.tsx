import { SectionHeading } from "@/components/marketing/page-intro";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Choose dates and pickup",
    body: "Select an Accra location and a 24-hour self-drive window. Staff still assign the physical car.",
  },
  {
    title: "Pick a model or similar",
    body: "Browse published saloons, SUVs, 4x4s and coaches. You hire a class of car, not a plate.",
  },
  {
    title: "Collect in Accra",
    body: "Handover at Plantsville, Kotoka, or a listed hotel desk, with documents checked before keys.",
  },
] as const;

export function HowHireWorks() {
  return (
    <section aria-labelledby="how-hire-works-heading">
      <SectionHeading id="how-hire-works-heading" title="How self-drive hire works" />
      <ol className="relative mt-8 grid gap-4 sm:grid-cols-3">
        <span
          aria-hidden
          className="pointer-events-none absolute top-6 right-[16%] left-[16%] z-0 hidden h-px bg-accent/40 sm:block"
        />
        {steps.map((step, index) => (
          <li key={step.title} className="relative z-10">
            <Card className="h-full gap-0 overflow-hidden rounded-2xl py-0 text-base shadow-none ring-border">
              <span className="block h-0.5 bg-accent" aria-hidden />
              <CardContent className="p-5">
                <p className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  <span className="sr-only">Step </span>
                  {index + 1}
                </p>
                <h3 className="mt-4 font-heading text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
