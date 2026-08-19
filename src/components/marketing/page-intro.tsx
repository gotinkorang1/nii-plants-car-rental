import { cn } from "@/lib/utils";

export function PageEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-xs font-medium tracking-[0.16em] text-primary uppercase sm:text-sm",
        className,
      )}
    >
      <span className="h-px w-6 bg-accent" aria-hidden />
      {children}
    </p>
  );
}

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
      {eyebrow ? <PageEyebrow>{eyebrow}</PageEyebrow> : null}
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">{title}</h1>
      {lede ? <p className="text-base text-muted-foreground sm:text-lg">{lede}</p> : null}
    </header>
  );
}

export function SectionHeading({
  id,
  title,
  action,
  className,
}: {
  id?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <h2 id={id} className="font-heading text-2xl tracking-tight">
        <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function PageMasthead({
  trail,
  intro,
  media,
}: {
  trail?: React.ReactNode;
  intro: React.ReactNode;
  media?: React.ReactNode;
}) {
  if (!media) {
    return (
      <>
        {trail}
        {intro}
      </>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-end">
      <div>
        {trail}
        {intro}
      </div>
      {media}
    </div>
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
