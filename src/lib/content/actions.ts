"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { tryGetDb } from "@/lib/db";
import { contentPages, faqs, mediaAssets, siteSettings } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
  uniqueMessage,
} from "@/lib/fleet/action-helpers";
import { CMS_MANAGE_ROLES } from "@/lib/content/permissions";
import { deleteWebsiteImageObject, uploadWebsiteImage } from "@/lib/content/storage";
import {
  contentPageSchema,
  faqSchema,
  mediaAssetMetadataSchema,
} from "@/lib/validation/content";
import {
  SITE_SETTING_KEYS,
  parseSiteSettingsRecord,
  socialLinksSchema,
} from "@/lib/settings/schema";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

function parsePageForm(formData: FormData) {
  return contentPageSchema.safeParse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug"),
    excerpt: formString(formData, "excerpt"),
    body: formString(formData, "body"),
    seoTitle: formString(formData, "seoTitle"),
    seoDescription: formString(formData, "seoDescription"),
    published: formCheckbox(formData, "published"),
  });
}

export async function createContentPage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parsePageForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the page details." };
  }

  try {
    await db.insert(contentPages).values({
      ...parsed.data,
      publishedAt: parsed.data.published ? new Date() : null,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The page could not be saved.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "cms.page.create",
    entityType: "content_page",
  });
  redirect("/admin/content/pages");
}

export async function updateContentPage(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parsePageForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the page details." };
  }

  try {
    await db
      .update(contentPages)
      .set({
        ...parsed.data,
        publishedAt: parsed.data.published ? new Date() : null,
      })
      .where(eq(contentPages.id, id));
  } catch (error) {
    return { error: uniqueMessage(error, "The page could not be updated.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "cms.page.update",
    entityType: "content_page",
    entityId: id,
  });
  revalidatePath("/admin/content/pages");
  revalidatePath(`/${parsed.data.slug}`);
  revalidatePath("/sitemap.xml");
  return { success: "Page saved." };
}

export async function unpublishContentPage(id: string): Promise<void> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [page] = await db
    .select({ slug: contentPages.slug })
    .from(contentPages)
    .where(eq(contentPages.id, id))
    .limit(1);

  await db
    .update(contentPages)
    .set({ published: false, publishedAt: null })
    .where(eq(contentPages.id, id));
  if (page) {
    revalidatePath(`/${page.slug}`);
  }
  revalidatePath("/admin/content/pages");
  redirect("/admin/content/pages");
}

export async function deleteContentPage(id: string): Promise<void> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db.delete(contentPages).where(eq(contentPages.id, id));
  redirect("/admin/content/pages");
}

function parseFaqForm(formData: FormData) {
  return faqSchema.safeParse({
    question: formString(formData, "question"),
    answer: formString(formData, "answer"),
    category: formString(formData, "category"),
    sortOrder: formString(formData, "sortOrder") || "0",
    published: formCheckbox(formData, "published"),
  });
}

export async function createFaq(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseFaqForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the FAQ details." };
  }

  await db.insert(faqs).values(parsed.data);
  await writeAuditLog({
    actorType: "staff",
    action: "cms.faq.create",
    entityType: "faq",
  });
  redirect("/admin/content/faqs");
}

export async function updateFaq(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseFaqForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the FAQ details." };
  }

  await db.update(faqs).set(parsed.data).where(eq(faqs.id, id));
  revalidatePath("/help/faqs");
  revalidatePath("/");
  revalidatePath("/admin/content/faqs");
  return { success: "FAQ saved." };
}

export async function deleteFaq(id: string): Promise<void> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db.delete(faqs).where(eq(faqs.id, id));
  redirect("/admin/content/faqs");
}

export async function uploadMediaAsset(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const parsed = mediaAssetMetadataSchema.safeParse({
    altText: formString(formData, "altText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Alt text is required." };
  }

  try {
    const uploaded = await uploadWebsiteImage(file);
    await db.insert(mediaAssets).values({
      storagePath: uploaded.storagePath,
      altText: parsed.data.altText,
      originalFilename: file.name || uploaded.storagePath,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "The image could not be uploaded.",
    };
  }

  revalidatePath("/admin/content/media");
  return { success: "Image uploaded." };
}

export async function updateMediaAsset(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = mediaAssetMetadataSchema.safeParse({
    altText: formString(formData, "altText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Alt text is required." };
  }

  await db
    .update(mediaAssets)
    .set({ altText: parsed.data.altText })
    .where(eq(mediaAssets.id, id));
  return { success: "Alt text saved." };
}

export async function deleteMediaAsset(
  id: string,
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  void previous;
  void formData;
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!asset) {
    return { error: "That image could not be found." };
  }

  const pages = await db.select({ body: contentPages.body }).from(contentPages);
  const referenced = pages.some((page) => page.body.includes(asset.storagePath));
  if (referenced) {
    return {
      error:
        "This image is still referenced in a page body. Remove that reference first.",
    };
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  try {
    await deleteWebsiteImageObject(asset.storagePath);
  } catch {
    // Row is gone; file cleanup can be retried later.
  }
  revalidatePath("/admin/content/media");
  return { success: "Image removed." };
}

export async function updateSiteSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(CMS_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const current = await getSiteSettings();

  const social = socialLinksSchema.safeParse({
    facebook: formString(formData, "facebook") || undefined,
    instagram: formString(formData, "instagram") || undefined,
    x: formString(formData, "x") || undefined,
    linkedin: formString(formData, "linkedin") || undefined,
  });
  if (!social.success) {
    return { error: "Check the social links." };
  }

  let parsed;
  try {
    parsed = parseSiteSettingsRecord({
      businessName: formString(formData, "businessName"),
      phone: formString(formData, "phone"),
      whatsapp: formString(formData, "whatsapp"),
      email: formString(formData, "email"),
      address: formString(formData, "address"),
      reservationPaymentPercent: Number(
        formString(formData, "reservationPaymentPercent") || "25",
      ),
      balanceDueHours: Number(formString(formData, "balanceDueHours") || "24"),
      minimumRentalHours: Number(
        formString(formData, "minimumRentalHours") || "24",
      ),
      holdDurationMinutes: Number(
        formString(formData, "holdDurationMinutes") || "10",
      ),
      quoteDurationMinutes: Number(
        formString(formData, "quoteDurationMinutes") || "15",
      ),
      currency: "GHS",
      homepageHeadline: formString(formData, "homepageHeadline"),
      homepageSubheadline: formString(formData, "homepageSubheadline"),
      socialLinks: social.data,
      bookingEnabled: current.bookingEnabled,
      onlinePaymentEnabled: current.onlinePaymentEnabled,
    });
  } catch {
    return { error: "Check the site settings." };
  }

  for (const key of SITE_SETTING_KEYS) {
    await db
      .insert(siteSettings)
      .values({ key, value: parsed[key] })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: parsed[key] },
      });
  }

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/help/requirements");
  return { success: "Site settings saved." };
}

export async function updateOperationalSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction("administrator");
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const current = await getSiteSettings();
  let parsed;
  try {
    parsed = parseSiteSettingsRecord({
      ...current,
      bookingEnabled: formCheckbox(formData, "bookingEnabled"),
      onlinePaymentEnabled: formCheckbox(formData, "onlinePaymentEnabled"),
    });
  } catch {
    return { error: "Check the operational settings." };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "operational_settings_updated",
    entityType: "site_settings",
    metadata: {
      bookingEnabled: parsed.bookingEnabled,
      onlinePaymentEnabled: parsed.onlinePaymentEnabled,
    },
  });

  for (const key of ["bookingEnabled", "onlinePaymentEnabled"] as const) {
    await db
      .insert(siteSettings)
      .values({ key, value: parsed[key] })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: parsed[key] },
      });
  }

  revalidatePath("/book");
  return { success: "Operational controls updated." };
}
