import { PublicActionBar } from "@/components/marketing/public-action-bar";
import { PublicFooter, PublicHeader } from "@/components/marketing/public-header";
import { SiteRail } from "@/components/marketing/site-rail";
import { SkipLink } from "@/components/ui/skip-link";
import { unstable_cache } from "next/cache";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";

const getCachedSiteSettings = unstable_cache(
  () => getSiteSettings(),
  ["public-site-settings"],
  { revalidate: 300, tags: ["public-site-settings"] },
);

export async function MarketingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCachedSiteSettings();
  const contact = toPublicContact(settings);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <SiteRail />
      <PublicHeader contact={contact} />
      <div id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </div>
      <PublicFooter contact={contact} />
      <PublicActionBar contact={contact} />
    </div>
  );
}
