import type { Metadata } from "next";
import Link from "next/link";

import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { listPublishedGalleryAlbums } from "@/lib/content/published-stories";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.gallery.title,
  description: PAGE_SEO.gallery.description,
  path: "/gallery",
});

export default async function GalleryPage() {
  const albums = await listPublishedGalleryAlbums();
  const images = albums.flatMap((album) =>
    album.images.map((image) => ({ ...image, albumId: album.id })),
  );

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Nii Plants photo gallery",
          description: PAGE_SEO.gallery.description,
          image: images.map((image) => image.src),
        }}
      />
      <PageBanner
        image={marketingImages.friends}
        eyebrow="Gallery"
        title="Photos of hire in Accra and Ghana"
        lede="Self-drive, chauffeur, Kotoka handover, and the Plantsville desk — plus albums staff publish from the console."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Gallery" },
        ]}
        compact
      />
      {albums.map((album, index) => (
        <Section
          key={album.id}
          id={album.id}
          className={index === 0 ? "pt-10" : "pt-0"}
          reveal
        >
          <SectionHeading title={album.title} />
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{album.body}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {album.images.map((image) => (
              <li key={image.src}>
                <figure className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                  <MarketingPhoto
                    image={image}
                    className="aspect-[4/3]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                    {image.alt}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <Section className="pt-0 pb-20" reveal>
        <p className="mb-6 text-sm text-muted-foreground">
          Awards and office news live on the{" "}
          <Link href="/news" className="text-accent hover:underline">
            news
          </Link>{" "}
          pages. For a car, start with the fleet.
        </p>
        <CtaPanel
          title="Choose a model"
          body="Published saloons, SUVs, 4x4s and coaches — Accra pickup, Ghana-only use."
          primaryHref="/fleet"
          primaryLabel="View the fleet"
          secondaryHref="/news"
          secondaryLabel="Read news"
        />
      </Section>
    </main>
  );
}
