import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/marketing/legal-page";
import { PAGE_SEO } from "@/lib/content/company";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/content/legal";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.terms.title,
  description: PAGE_SEO.terms.description,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      crumb="Terms"
      eyebrow="Legal"
      title="Hire terms"
      lede={TERMS_INTRO}
      image={marketingImages.keys}
      sections={TERMS_SECTIONS}
    >
      <p className="mt-10 text-sm text-muted-foreground">
        How we use personal data is on the{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          privacy notice
        </Link>
        . Pickup documents are listed under{" "}
        <Link href="/help/requirements" className="text-accent hover:underline">
          rental requirements
        </Link>
        .
      </p>
    </LegalPage>
  );
}
