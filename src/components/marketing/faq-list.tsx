export function FaqList({
  items,
}: {
  items: { id: string; question: string; answer: string }[];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
        No published FAQs yet. Staff can add them in the website CMS.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {items.map((item) => (
        <details key={item.id} className="group px-5 py-4">
          <summary className="cursor-pointer list-none font-medium transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span
                aria-hidden
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted-foreground transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
