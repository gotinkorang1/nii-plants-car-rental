import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaLibrary } from "@/components/admin/content/media-library";
import { requireStaff } from "@/lib/auth/require-staff";
import { getWebsiteMediaPublicUrl } from "@/lib/content/media-url";
import { canManageCms } from "@/lib/content/permissions";
import { listMediaAssetsAdmin } from "@/lib/content/queries";

export default async function MediaLibraryPage() {
  const staff = await requireStaff();
  const assets = await listMediaAssetsAdmin();
  const canWrite = canManageCms(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media"
        description="Website images stored in the public website-media bucket. Alt text is required."
      />
      <MediaLibrary
        canEdit={canWrite}
        assets={assets.map((asset) => ({
          id: asset.id,
          altText: asset.altText,
          originalFilename: asset.originalFilename,
          mimeType: asset.mimeType,
          sizeBytes: asset.sizeBytes,
          url: getWebsiteMediaPublicUrl(asset.storagePath),
        }))}
      />
    </div>
  );
}
