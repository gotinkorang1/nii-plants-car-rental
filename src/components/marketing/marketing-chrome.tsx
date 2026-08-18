import { PublicFooter, PublicHeader } from "@/components/marketing/public-header";
import { SkipLink } from "@/components/ui/skip-link";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";

export async function MarketingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const contact = toPublicContact(settings);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <PublicHeader contact={contact} />
      <div id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </div>
      <PublicFooter contact={contact} />
    </div>
  );
}
