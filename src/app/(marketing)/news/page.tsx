import type { Metadata } from "next";
import Link from "next/link";

import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { listPublishedStories } from "@/lib/content/published-stories";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.news.title,
  description: PAGE_SEO.news.description,
  path: "/news",
});

const kindLabel = {
  news: "News",
  blog: "Blog",
  video: "Video",
} as const;

export default async function NewsIndexPage() {
  const stories = await listPublishedStories();

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Nii Plants news",
          description: PAGE_SEO.news.description,
          blogPost: stories.map((article) => ({
            "@type": "BlogPosting",
            headline: article.title,
            datePublished: article.date,
            url: `/news/${article.slug}`,
            description: article.excerpt,
          })),
        }}
      />
      <PageBanner
        image={marketingImages.workshop}
        eyebrow="News"
        title="News from Nii Plants in Accra"
        lede="Awards, the Dansoman office, pickup points, and stories staff publish from the Accra desk. We publish confirmed company news, not invented review counts."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "News" },
        ]}
        compact
      />
      <Section className="pt-10" reveal>
        <ul className="reveal-stagger grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((article) => (
            <li key={article.slug}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                <Link href={`/news/${article.slug}`} className="group block">
                  <MarketingPhoto
                    image={article.image}
                    className="aspect-[16/10]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    zoomOnHover
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                    {kindLabel[article.kind]} · {article.dateLabel}
                  </p>
                  <h2 className="mt-2 font-heading text-xl">
                    <Link href={`/news/${article.slug}`} className="hover:text-accent">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{article.excerpt}</p>
                  <p className="mt-4 text-sm font-medium text-accent">
                    <Link href={`/news/${article.slug}`}>
                      {article.kind === "video" ? "Watch" : "Read article"}
                    </Link>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="See the fleet"
          body="Browse published models, or open the gallery of Accra hire, chauffeur, and handover photos."
          primaryHref="/fleet"
          primaryLabel="View the fleet"
          secondaryHref="/gallery"
          secondaryLabel="Open gallery"
        />
      </Section>
    </main>
  );
}
