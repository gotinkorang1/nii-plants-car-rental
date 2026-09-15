import Link from "next/link";

import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageEyebrow } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { marketingImages } from "@/lib/content/marketing-images";

export function NotFoundContent() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <MarketingPhoto
        image={marketingImages.arrival}
        className="mb-8 aspect-[16/10] rounded-2xl"
        sizes="(max-width: 640px) 100vw, 36rem"
      />
      <PageEyebrow>404</PageEyebrow>
      <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        This page is unpublished, inactive, or does not exist. Try browsing the fleet or
        contacting our team.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="h-11 px-4">
          <Link href="/">Return home</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href="/fleet">Browse fleet</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="h-11 px-4">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </main>
  );
}
