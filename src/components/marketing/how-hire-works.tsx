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
      <h2 id="how-hire-works-heading" className="font-heading text-2xl">
        How self-drive hire works
      </h2>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl bg-card p-5 ring-1 ring-border"
          >
            <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
              Step {index + 1}
            </p>
            <h3 className="mt-3 font-heading text-xl">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
