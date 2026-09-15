import type { Metadata } from "next";

import { CtaPanel } from "@/components/marketing/cta-panel";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { Badge } from "@/components/ui/badge";
import { PAGE_SEO } from "@/lib/content/company";
import { FAQ_CATEGORIES, faqCategoryId } from "@/lib/content/faq-categories";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
} from "@/lib/content/structured-data";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.faqs.title,
  description: PAGE_SEO.faqs.description,
  path: "/help/faqs",
});

export default async function FaqsPage() {
  const faqs = await getPublishedFaqs();
  const grouped = FAQ_CATEGORIES.map((category) => ({
    category,
    items: faqs.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
  const faqSchema = faqPageJsonLd(faqs);

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Help", path: "/help" },
          { name: "FAQs", path: "/help/faqs" },
        ])}
      />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <PageBanner
        image={marketingImages.portrait}
        eyebrow="Help"
        title="Car rental FAQs for Accra and Ghana"
        lede="Booking, payments, Kotoka pickup, insurance, extra drivers, and free cancellation 48 hours before pickup."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Help", href: "/help" },
          { name: "FAQs" },
        ]}
        compact
      />
      <Section className="pt-10" reveal>
        {grouped.length > 1 ? (
          <nav aria-label="FAQ topics" className="mb-10">
            <ul className="flex flex-wrap gap-2">
              {grouped.map((group) => (
                <li key={group.category}>
                    <Badge
                      asChild
                      variant="secondary"
                      className="h-auto rounded-full px-3 py-1.5 text-sm font-normal text-muted-foreground hover:text-primary"
                    >
                      <a href={`#${faqCategoryId(group.category)}`}>
                        {group.category}
                      </a>
                    </Badge>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {grouped.length === 0 ? (
          <div className="mt-8">
            <FaqList items={[]} />
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {grouped.map((group) => (
              <section
                key={group.category}
                aria-labelledby={faqCategoryId(group.category)}
              >
                <h2
                  id={faqCategoryId(group.category)}
                  className="font-heading scroll-mt-32 text-2xl"
                >
                  {group.category}
                </h2>
                <div className="mt-4">
                  <FaqList items={group.items} />
                </div>
              </section>
            ))}
          </div>
        )}
      </Section>
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Talk to the Plantsville desk"
          body="Call, WhatsApp, or email during Monday–Saturday office hours for booking, Kotoka, and document questions."
        />
      </Section>
    </main>
  );
}
