import "server-only";

import { eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { enquiries, vehicleClasses } from "@/lib/db/schema";
import {
  enquiryQuoteEmail,
  enquiryReceivedEmail,
  enquiryStaffNotificationEmail,
} from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send-email";
import { enquiryServiceLabel } from "@/lib/enquiries/status";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { log } from "@/lib/logger";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

function enquiryNotificationEmail(settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  return (
    process.env.ENQUIRY_NOTIFICATION_EMAIL?.trim() ||
    settings.email?.trim() ||
    undefined
  );
}

function formatWhen(value: Date | null | undefined) {
  if (!value) {
    return undefined;
  }
  return `${utcToAccraDateInput(value)} ${utcToAccraTimeInput(value)}`;
}

function buildSummary(enquiry: typeof enquiries.$inferSelect, className?: string | null) {
  const lines: string[] = [];
  if (enquiry.pickupAt) {
    lines.push(`Requested time: ${formatWhen(enquiry.pickupAt)}`);
  }
  if (enquiry.pickupLocationText) {
    lines.push(`Pickup: ${enquiry.pickupLocationText}`);
  }
  if (enquiry.returnLocationText) {
    lines.push(`Destination: ${enquiry.returnLocationText}`);
  }
  if (enquiry.passengerCount) {
    lines.push(`Passengers: ${enquiry.passengerCount}`);
  }
  if (className) {
    lines.push(`Preferred class: ${className}`);
  }
  return lines;
}

export async function notifyEnquiryReceived(enquiryId: string) {
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [row] = await db
    .select({
      enquiry: enquiries,
      className: vehicleClasses.name,
    })
    .from(enquiries)
    .leftJoin(vehicleClasses, eq(enquiries.vehicleClassId, vehicleClasses.id))
    .where(eq(enquiries.id, enquiryId))
    .limit(1);

  if (!row) {
    return;
  }

  const settings = await getSiteSettings();
  const serviceLabel = enquiryServiceLabel(row.enquiry.serviceType);
  const summaryLines = buildSummary(row.enquiry, row.className);

  const customerResult = await sendEmail({
    to: row.enquiry.email,
    email: enquiryReceivedEmail({
      firstName: row.enquiry.firstName,
      reference: row.enquiry.reference,
      serviceLabel,
      summaryLines,
      supportEmail: settings.email || undefined,
      supportPhone: settings.phone || undefined,
    }),
  });

  if (!customerResult.ok) {
    log("warn", "enquiry_email_failed", { enquiryId, template: "enquiry-received" });
  } else {
    log("info", "enquiry_email_sent", { enquiryId, template: "enquiry-received" });
  }

  const staffEmail = enquiryNotificationEmail(settings);
  if (staffEmail) {
    const staffResult = await sendEmail({
      to: staffEmail,
      email: enquiryStaffNotificationEmail({
        reference: row.enquiry.reference,
        serviceLabel,
        customerName: `${row.enquiry.firstName} ${row.enquiry.lastName}`,
        customerEmail: row.enquiry.email,
        customerPhone: row.enquiry.phone,
        adminUrl: `${appBaseUrl()}/admin/enquiries/${row.enquiry.id}`,
      }),
    });
    if (!staffResult.ok) {
      log("warn", "enquiry_email_failed", {
        enquiryId,
        template: "enquiry-staff-notification",
      });
    } else {
      log("info", "enquiry_email_sent", {
        enquiryId,
        template: "enquiry-staff-notification",
      });
    }
  }
}

export async function notifyEnquiryQuote(enquiryId: string) {
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [row] = await db
    .select()
    .from(enquiries)
    .where(eq(enquiries.id, enquiryId))
    .limit(1);

  if (!row || row.quotedAmount === null) {
    return;
  }

  const settings = await getSiteSettings();
  const result = await sendEmail({
    to: row.email,
    email: enquiryQuoteEmail({
      firstName: row.firstName,
      reference: row.reference,
      serviceLabel: enquiryServiceLabel(row.serviceType),
      quotedAmount: row.quotedAmount,
      quoteValidUntil: row.quoteValidUntil
        ? formatWhen(row.quoteValidUntil)
        : undefined,
      quoteNotes: row.quoteNotes ?? undefined,
      supportEmail: settings.email || undefined,
      supportPhone: settings.phone || undefined,
    }),
  });

  if (!result.ok) {
    log("warn", "enquiry_email_failed", { enquiryId, template: "enquiry-quote" });
  } else {
    log("info", "enquiry_email_sent", { enquiryId, template: "enquiry-quote" });
  }
}
