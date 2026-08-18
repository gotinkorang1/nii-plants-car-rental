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
    <div className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
      {items.map((item) => (
        <details key={item.id} className="group px-5 py-4">
          <summary className="cursor-pointer list-none font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span aria-hidden className="text-muted-foreground group-open:hidden">
                +
              </span>
              <span aria-hidden className="hidden text-muted-foreground group-open:inline">
                −
              </span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
