import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageIntro, Section } from "@/components/marketing/page-intro";
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
        <PageIntro eyebrow={eyebrow} title={title} lede={lede} />
        {image ? (
          <MarketingPhoto
            image={image}
            className="mt-8 aspect-[16/9] max-w-4xl rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        ) : null}
        {form ? null : (
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            {ctaHref && ctaLabel ? (
              <Button asChild>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Button asChild variant="outline">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </Section>
      {form ? (
        <Section className="pt-0">
          <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Request a quote — our team reviews every enquiry. This is not an instant
            booking confirmation.
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl">What this is for</h2>
              <ul className="mt-6 grid gap-4">
                {benefits.map((item) => (
                  <li
                    key={item.title}
                    className="border-l-2 border-primary bg-card p-5 ring-1 ring-border"
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
              <h2 className="mt-8 font-heading text-2xl">How it works</h2>
              <ol className="mt-6 grid gap-4">
                {steps.map((item, index) => (
                  <li key={item.title} className="rounded-2xl bg-card p-5 ring-1 ring-border">
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-2 font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
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
        <h2 className="font-heading text-2xl">What this is for</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {benefits.map((item) => (
            <li
              key={item.title}
              className="border-l-2 border-primary bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0">
        <h2 className="font-heading text-2xl">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((item, index) => (
            <li key={item.title} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Step {index + 1}
              </p>
              <h3 className="mt-2 font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>
        </>
      )}
      <Section className="pt-0">
        <h2 className="font-heading text-2xl">Questions</h2>
        <div className="mt-6">
          <FaqList items={faqs} />
        </div>
      </Section>
    </main>
  );
}
