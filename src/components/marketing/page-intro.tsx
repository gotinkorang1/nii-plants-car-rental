import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  lede,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  className?: string;
}) {
  return (
    <header className={cn("max-w-2xl space-y-3", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">{title}</h1>
      {lede ? <p className="text-base text-muted-foreground sm:text-lg">{lede}</p> : null}
    </header>
  );
}

export function Section({
  id,
  children,
  className,
  reveal = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  reveal?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-14 sm:px-6",
        reveal && "reveal-on-scroll",
        className,
      )}
    >
      {children}
    </section>
  );
}
