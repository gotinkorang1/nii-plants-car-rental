import { notFound } from "next/navigation";

import { EnquiryDetailPanel } from "@/components/admin/enquiries/enquiry-detail-panel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireStaff } from "@/lib/auth/require-staff";
import { canMutateEnquiries, canViewEnquiries } from "@/lib/enquiries/permissions";
import {
  getEnquiryDetail,
  isQuoteExpired,
  listAssignableStaff,
} from "@/lib/enquiries/queries";
import { enquiryServiceLabel } from "@/lib/enquiries/status";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEnquiryDetailPage({ params }: PageProps) {
  const staff = await requireStaff();
  if (!canViewEnquiries(staff.role)) {
    notFound();
  }

  const { id } = await params;
  const detail = await getEnquiryDetail(id);
  const assignableStaff = await listAssignableStaff();
  const settings = await getSiteSettings();

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={detail.enquiry.reference}
        description={`${enquiryServiceLabel(detail.enquiry.serviceType)} · ${detail.enquiry.firstName} ${detail.enquiry.lastName}`}
      />
      <EnquiryDetailPanel
        detail={{
          enquiry: {
            ...detail.enquiry,
            serviceDetails: (detail.enquiry.serviceDetails ?? {}) as Record<string, unknown>,
          },
          vehicleClassName: detail.vehicleClassName,
          assigneeName: detail.assigneeName,
          history: detail.history.map((item) => ({
            fromStatus: item.fromStatus,
            toStatus: item.toStatus,
            createdAt: item.createdAt,
            reason: item.reason,
          })),
          staff: assignableStaff,
          canMutate: canMutateEnquiries(staff.role),
          quoteExpired: isQuoteExpired(detail.enquiry.quoteValidUntil),
          whatsapp: settings.whatsapp || undefined,
        }}
      />
    </div>
  );
}
