import type { Metadata } from "next";

import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs } from "@/lib/content/queries";
import { FAQ_CATEGORIES, faqCategoryId } from "@/lib/content/faq-categories";
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
      <Section className="pt-10">
        <PageIntro
          eyebrow="Help"
          title="Car rental FAQs for Accra and Ghana"
          lede="Booking, payments, Kotoka pickup, insurance, extra drivers, and free cancellation 48 hours before pickup."
        />
        <MarketingPhoto
          image={marketingImages.portrait}
          className="mt-8 aspect-[16/8] max-w-3xl rounded-2xl"
          sizes="(max-width: 768px) 100vw, 48rem"
          priority
        />
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
                  className="font-heading text-2xl"
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
    </main>
  );
}
