import { MarketingChrome } from "@/components/marketing/marketing-chrome";

export const dynamic = "force-dynamic";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingChrome>{children}</MarketingChrome>;
}
