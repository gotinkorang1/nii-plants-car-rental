import type { ReactNode } from "react";

import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import {
  LEGAL_UPDATED_LABEL,
  type LegalSection,
} from "@/lib/content/legal";
import type { MarketingImage } from "@/lib/content/marketing-images";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export function LegalPage({
  path,
  crumb,
  eyebrow,
  title,
  lede,
  image,
  sections,
  children,
}: {
  path: "/privacy" | "/terms";
  crumb: string;
  eyebrow: string;
  title: string;
  lede: string;
  image: MarketingImage;
  sections: readonly LegalSection[];
  children?: ReactNode;
}) {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: crumb, path },
        ])}
      />
      <PageBanner
        image={image}
        eyebrow={eyebrow}
        title={title}
        lede={lede}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: crumb },
        ]}
      />
      <Section className="pt-10 pb-20" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav
            aria-label="On this page"
            className="lg:sticky lg:top-24"
          >
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
              On this page
            </p>
            <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {sections.map((section) => (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    className="block rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-md lg:px-0"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">
              Last updated {LEGAL_UPDATED_LABEL}.
            </p>
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-32 border-t border-border/80 pt-8 mt-8 first:mt-6 first:border-t-0 first:pt-0"
              >
                <h2 className="font-heading text-2xl tracking-tight">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={`${section.id}-${index}`}
                    className="mt-4 text-base leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
            {children}
          </div>
        </div>
      </Section>
    </main>
  );
}
