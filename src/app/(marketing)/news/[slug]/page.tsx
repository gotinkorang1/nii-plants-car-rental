import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { VideoEmbed } from "@/components/marketing/video-embed";
import { COMPANY } from "@/lib/content/company";
import {
  getPublishedStory,
  listPublishedStories,
} from "@/lib/content/published-stories";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedStory(slug);
  if (!article) {
    return { title: "Article not found" };
  }
  return pageMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    path: `/news/${article.slug}`,
    images: [article.image.src],
  });
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedStory(slug);
  if (!article) {
    notFound();
  }

  const related = (await listPublishedStories())
    .filter((item) => item.slug !== article.slug)
    .slice(0, 2);

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
          { name: article.title, path: `/news/${article.slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": article.kind === "video" ? "VideoObject" : "NewsArticle",
          headline: article.title,
          name: article.title,
          datePublished: article.date,
          description: article.excerpt,
          author: { "@type": "Organization", name: COMPANY.brandName },
          publisher: { "@type": "Organization", name: COMPANY.brandName },
          image: article.image.src,
        }}
      />
      <PageBanner
        image={article.image}
        eyebrow={article.kind === "video" ? "Video" : article.kind === "blog" ? "Blog" : "News"}
        title={article.title}
        lede={article.excerpt}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "News", href: "/news" },
          { name: article.title },
        ]}
      />
      <Section className="max-w-3xl pt-10" reveal>
        <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
          {article.dateLabel}
        </p>
        {article.videoEmbedUrl ? (
          <div className="mt-6">
            <VideoEmbed url={article.videoEmbedUrl} title={article.title} />
          </div>
        ) : null}
        {article.bodyHtml.trim() ? (
          <article
            className="prose-nii mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground [&_a]:text-accent [&_a]:underline [&_h2]:font-heading [&_h2]:text-2xl [&_h3]:font-heading [&_h3]:text-xl [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        ) : null}
        <p className="mt-8 text-sm">
          <Link href="/news" className="text-accent hover:underline">
            All news
          </Link>
          {" · "}
          <Link href="/about" className="text-accent hover:underline">
            About Nii Plants
          </Link>
        </p>
      </Section>
      {related.length > 0 ? (
        <Section className="pt-0" reveal>
          <h2 className="font-heading text-2xl">
            <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
            More stories
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/news/${item.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border"
                >
                  <MarketingPhoto
                    image={item.image}
                    className="aspect-[16/9]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    zoomOnHover
                  />
                  <span className="p-4">
                    <span className="block text-xs text-muted-foreground">{item.dateLabel}</span>
                    <span className="mt-1 block font-medium group-hover:text-accent">{item.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Hire a car in Accra"
          body="Check self-drive availability, or browse published models."
        />
      </Section>
    </main>
  );
}
