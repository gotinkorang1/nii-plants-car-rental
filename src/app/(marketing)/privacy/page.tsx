import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/marketing/legal-page";
import { PAGE_SEO } from "@/lib/content/company";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/content/legal";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.privacy.title,
  description: PAGE_SEO.privacy.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      crumb="Privacy"
      eyebrow="Legal"
      title="Privacy notice"
      lede={PRIVACY_INTRO}
      image={marketingImages.phone}
      sections={PRIVACY_SECTIONS}
    >
      <p className="mt-10 text-sm text-muted-foreground">
        Hire rules sit on{" "}
        <Link href="/terms" className="text-accent hover:underline">
          hire terms
        </Link>
        {" "}and{" "}
        <Link href="/help/requirements" className="text-accent hover:underline">
          rental requirements
        </Link>
        .
      </p>
    </LegalPage>
  );
}
