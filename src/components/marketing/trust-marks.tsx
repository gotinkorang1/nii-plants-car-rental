import { cn } from "@/lib/utils";

const marks = [
  { title: "Accra hire since 2007", body: "Ghanaian-owned, Dansoman based" },
  { title: "GTA awards", body: "National and Greater Accra, 2022 and 2024" },
  { title: "Kotoka pickup", body: "Meet-and-greet until 23:00 by arrangement" },
] as const;

export function TrustMarks({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "relative grid overflow-hidden rounded-2xl bg-card ring-1 ring-border sm:grid-cols-3",
        className,
      )}
    >
      <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden />
      {marks.map((item) => (
        <li
          key={item.title}
          className="border-border px-5 py-5 sm:border-l sm:first-of-type:border-l-0"
        >
          <p className="text-sm font-medium text-primary">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
