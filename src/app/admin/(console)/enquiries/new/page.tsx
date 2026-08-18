import { StaffEnquiryForm } from "@/components/admin/enquiries/staff-enquiry-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { ENQUIRY_MUTATE_ROLES } from "@/lib/enquiries/permissions";
import { listActiveVehicleClassOptions } from "@/lib/enquiries/queries";

export default async function NewEnquiryPage() {
  await requireRole(ENQUIRY_MUTATE_ROLES);
  const vehicleClasses = await listActiveVehicleClassOptions();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="New enquiry"
        description="Record a phone, WhatsApp, or walk-in service request."
      />
      <StaffEnquiryForm vehicleClasses={vehicleClasses} />
    </div>
  );
}
