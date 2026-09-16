import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { PageTrail } from "@/components/marketing/page-trail";
import { isReservedPublicSlug } from "@/lib/content/reserved-slugs";
import { cmsSeoDescription, cmsSeoTitle, pageMetadata } from "@/lib/content/seo";
import { getPublishedContentPage } from "@/lib/content/queries";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedPublicSlug(slug)) {
    return { title: "Page not found" };
  }
  const page = await getPublishedContentPage(slug);
  if (!page) {
    notFound();
  }

  const title = cmsSeoTitle(page);
  const description = cmsSeoDescription(page);
  return pageMetadata({
    title,
    description: description ?? page.title,
    path: `/${page.slug}`,
  });
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  const page = await getPublishedContentPage(slug);
  if (!page) {
    notFound();
  }

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: page.title,
          description: cmsSeoDescription(page),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: page.title, path: `/${page.slug}` },
        ])}
      />
      <Section className="pt-10 pb-20">
        <PageTrail
          items={[
            { name: "Home", href: "/" },
            { name: page.title },
          ]}
        />
        <PageIntro title={page.title} lede={page.excerpt || undefined} />
        <article
          className="prose-nii mt-8 max-w-2xl space-y-4 text-base leading-relaxed [&_a]:text-primary [&_a]:underline [&_h2]:font-heading [&_h2]:text-2xl [&_h3]:font-heading [&_h3]:text-xl [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </Section>
    </main>
  );
}
