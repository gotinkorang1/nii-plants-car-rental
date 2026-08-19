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
        "grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-3",
        className,
      )}
    >
      {marks.map((item) => (
        <li key={item.title} className="bg-card px-5 py-4">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
