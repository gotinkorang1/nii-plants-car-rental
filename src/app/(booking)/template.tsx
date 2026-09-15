import { PageEnter } from "@/components/marketing/page-enter";

export default function BookingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageEnter>{children}</PageEnter>;
}
