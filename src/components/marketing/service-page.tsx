import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageIntro, PageMasthead, Section, SectionHeading } from "@/components/marketing/page-intro";
import { PageTrail } from "@/components/marketing/page-trail";
import type { MarketingImage } from "@/lib/content/marketing-images";
import { faqPageJsonLd } from "@/lib/content/structured-data";

export function ServicePage({
  eyebrow,
  title,
  lede,
  image,
  benefits,
  steps,
  faqs,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  form,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  image?: MarketingImage;
  benefits: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  faqs: { id: string; question: string; answer: string }[];
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  form?: React.ReactNode;
}) {
  const faqSchema = faqPageJsonLd(faqs);

  return (
    <main>
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <Section className="pt-10">
        <PageMasthead
          trail={
            <PageTrail
              items={[
                { name: "Home", href: "/" },
                { name: "Services", href: "/services" },
                { name: eyebrow },
              ]}
            />
          }
          intro={
            <>
              <PageIntro eyebrow={eyebrow} title={title} lede={lede} />
              {form ? null : (
                <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                  {ctaHref && ctaLabel ? (
                    <Button asChild size="lg" className="h-11 px-4">
                      <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                  ) : null}
                  {secondaryHref && secondaryLabel ? (
                    <Button asChild size="lg" variant="outline" className="h-11 px-4">
                      <Link href={secondaryHref}>{secondaryLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </>
          }
          media={
            image ? (
              <MarketingPhoto
                image={image}
                className="aspect-[16/10] rounded-2xl lg:aspect-[4/3]"
                sizes="(max-width: 1024px) 100vw, 28rem"
                priority
              />
            ) : undefined
          }
        />
      </Section>
      {form ? (
        <Section className="pt-0">
          <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Request a quote — our team reviews every enquiry. This is not an instant
            booking confirmation.
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeading title="What this is for" />
              <ul className="mt-6 grid gap-4">
                {benefits.map((item) => (
                  <li
                    key={item.title}
                    className="overflow-hidden border-l-2 border-accent bg-card p-5 ring-1 ring-border"
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
              <SectionHeading className="mt-8" title="How it works" />
              <ol className="mt-6 grid gap-4">
                {steps.map((item, index) => (
                  <li key={item.title} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                    <span className="block h-0.5 bg-accent" aria-hidden />
                    <div className="p-5">
                      <p className="text-xs font-medium tracking-wide text-primary uppercase">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-2 font-medium">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {form}
          </div>
        </Section>
      ) : (
        <>
      <Section className="pt-0">
        <SectionHeading title="What this is for" />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {benefits.map((item) => (
            <li
              key={item.title}
              className="overflow-hidden border-l-2 border-accent bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0">
        <SectionHeading title="How it works" />
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((item, index) => (
            <li key={item.title} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              <span className="block h-0.5 bg-accent" aria-hidden />
              <div className="p-5">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
        </>
      )}
      <Section className="pt-0">
        <SectionHeading title="Questions" />
        <div className="mt-6">
          <FaqList items={faqs} />
        </div>
      </Section>
    </main>
  );
}
