import { PageEnter } from "@/components/marketing/page-enter";

export default function MarketingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
