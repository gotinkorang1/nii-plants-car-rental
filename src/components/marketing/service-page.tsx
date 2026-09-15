import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { COPY } from "@/lib/content/copy";
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
      <PageBanner
        image={
          image ?? {
            src: "/images/self-drive.webp",
            alt: "Nii Plants car hire",
            width: 1600,
            height: 1065,
          }
        }
        eyebrow={eyebrow}
        title={title}
        lede={lede}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: eyebrow },
        ]}
      >
        {form ? null : (
          <div className="flex flex-col gap-2 sm:flex-row">
            {ctaHref && ctaLabel ? (
              <Button asChild size="lg" className="h-11 px-4">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 border-white/40 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </PageBanner>
      {form ? (
        <Section className="pt-10" reveal>
          <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border">
            Request a quote — our team reviews every enquiry. This is not an instant
            booking confirmation.
          </p>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
            <div>
              <SectionHeading title="What this is for" />
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {benefits.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border-l-2 border-accent bg-card p-5 ring-1 ring-border"
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
              <SectionHeading className="mt-10" title="How it works" />
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {steps.map((item, index) => (
                  <li
                    key={item.title}
                    className="overflow-hidden rounded-2xl bg-card ring-1 ring-border"
                  >
                    <span className="block h-0.5 bg-accent" aria-hidden />
                    <div className="p-5">
                      <p className="text-xs font-medium tracking-wide text-primary uppercase">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-2 font-medium">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-24">{form}</div>
          </div>
        </Section>
      ) : (
        <>
          <Section className="pt-10" reveal>
            <SectionHeading title="What this is for" />
            <ul className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border-l-2 border-accent bg-card p-5 ring-1 ring-border"
                >
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
          <Section className="pt-0" reveal>
            <SectionHeading title="How it works" />
            <ol className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-3">
              {steps.map((item, index) => (
                <li
                  key={item.title}
                  className="overflow-hidden rounded-2xl bg-card ring-1 ring-border"
                >
                  <span className="block h-0.5 bg-accent" aria-hidden />
                  <div className="p-5">
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-2 font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
      {faqs.length > 0 ? (
        <Section className="pt-0" reveal>
          <SectionHeading title="Questions" />
          <div className="mt-6">
            <FaqList items={faqs} />
          </div>
        </Section>
      ) : null}
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel title={COPY.ctaTitle} body={COPY.ctaBody} />
      </Section>
    </main>
  );
}
