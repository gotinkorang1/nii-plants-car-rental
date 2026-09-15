import { SectionHeading } from "@/components/marketing/page-intro";
import { CLIENTS } from "@/lib/content/clients";
import { COPY } from "@/lib/content/copy";
import { cn } from "@/lib/utils";

export function ClienteleLogos({
  heading = "Organisations we have hired to",
  className,
}: {
  heading?: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <SectionHeading title={heading} />
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {COPY.clientele}
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {CLIENTS.map((client) => (
          <li key={client.name}>
            <figure className="flex h-24 items-center justify-center rounded-2xl bg-card px-4 ring-1 ring-border">
              {/* Native img: local SVGs, object-contain, no Next optimizer needed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={client.src}
                alt={client.name}
                width={client.width}
                height={client.height}
                className="max-h-12 w-auto max-w-full object-contain opacity-80 grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0 motion-reduce:transition-none"
              />
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
