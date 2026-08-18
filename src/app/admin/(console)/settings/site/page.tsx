import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OperationalSettingsForm } from "@/components/admin/content/operational-settings-form";
import { SiteSettingsForm } from "@/components/admin/content/site-settings-form";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasRequiredRole } from "@/lib/auth/roles";
import { updateOperationalSettings, updateSiteSettings } from "@/lib/content/actions";
import { canManageCms } from "@/lib/content/permissions";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export default async function SiteSettingsPage() {
  const staff = await requireStaff();
  const settings = await getSiteSettings();
  const canWrite = canManageCms(staff.role);
  const canManageOperations = hasRequiredRole(staff.role, "administrator");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site settings"
        description="Homepage copy and public contact details. Empty contact fields stay hidden on the website."
      />
      {canManageOperations ? (
        <OperationalSettingsForm
          action={updateOperationalSettings}
          defaults={{
            bookingEnabled: settings.bookingEnabled,
            onlinePaymentEnabled: settings.onlinePaymentEnabled,
          }}
        />
      ) : null}
      {canWrite ? (
        <SiteSettingsForm action={updateSiteSettings} defaults={settings} />
      ) : (
        <dl className="max-w-xl space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Business name</dt>
            <dd>{settings.businessName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Homepage headline</dt>
            <dd>{settings.homepageHeadline || "Not set"}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
