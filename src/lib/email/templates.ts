import { formatGhs } from "@/lib/money";

export type EmailTemplateName =
  | "booking-created"
  | "booking-access-code"
  | "booking-cancelled"
  | "booking-expired"
  | "booking-confirmed"
  | "payment-received"
  | "payment-received-availability-review"
  | "vehicle-ready"
  | "vehicle-collected"
  | "rental-completed"
  | "enquiry-received"
  | "enquiry-staff-notification"
  | "enquiry-quote";

export type BookingEmailCopy = {
  firstName: string;
  email: string;
  reference: string;
  vehicleLabel: string;
  pickupLabel: string;
  returnLabel: string;
  rentalTotal: number;
  reservationPaymentRequired: number;
  remainingBalance: number;
  securityDepositRequired: number;
  accessUrl: string;
};

export type RenderedEmail = {
  template: EmailTemplateName;
  subject: string;
  text: string;
  html: string;
};

function wrapHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f6f1ea;color:#1f1a16;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#fffaf4;border:1px solid #e6d9c8;border-radius:16px;padding:28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#9a4d1c;">Nii Plants Car Rental</p>
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${title}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function bookingCreatedEmail(input: BookingEmailCopy): RenderedEmail {
  const subject = `Booking ${input.reference} created — payment required`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Your booking request has been created. Your vehicle is temporarily held. Payment is required to confirm the reservation.",
    "",
    `Reference: ${input.reference}`,
    `Vehicle: ${input.vehicleLabel}`,
    `Pickup: ${input.pickupLabel}`,
    `Return: ${input.returnLabel}`,
    `Rental total: ${formatGhs(input.rentalTotal)}`,
    `Reservation payment required: ${formatGhs(input.reservationPaymentRequired)}`,
    `Remaining balance: ${formatGhs(input.remainingBalance)}`,
    "",
    `Retrieve this booking securely: ${input.accessUrl}`,
    "You will need this reference and the email used on the booking, plus a verification code.",
    "",
    "This is not a confirmed reservation yet.",
  ].join("\n");

  return {
    template: "booking-created",
    subject,
    text,
    html: wrapHtml(
      "Booking created — payment required",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Your booking request has been created. Your vehicle is temporarily held. Payment is required to confirm the reservation.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Vehicle:</strong> ${escapeHtml(input.vehicleLabel)}<br/>
       <strong>Pickup:</strong> ${escapeHtml(input.pickupLabel)}<br/>
       <strong>Return:</strong> ${escapeHtml(input.returnLabel)}<br/>
       <strong>Rental total:</strong> ${escapeHtml(formatGhs(input.rentalTotal))}<br/>
       <strong>Reservation payment required:</strong> ${escapeHtml(formatGhs(input.reservationPaymentRequired))}<br/>
       <strong>Remaining balance:</strong> ${escapeHtml(formatGhs(input.remainingBalance))}</p>
       <p>Retrieve this booking securely at <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>. You will need the reference, booking email, and a verification code.</p>
       <p>This is not a confirmed reservation yet.</p>`,
    ),
  };
}

export function bookingAccessCodeEmail(input: {
  firstName: string;
  reference: string;
  code: string;
  expiresMinutes: number;
}): RenderedEmail {
  const subject = `Your booking access code for ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    `Your verification code for booking ${input.reference} is ${input.code}.`,
    `It expires in ${input.expiresMinutes} minutes and can be used once.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n");

  return {
    template: "booking-access-code",
    subject,
    text,
    html: wrapHtml(
      "Verification code",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Your verification code for booking <strong>${escapeHtml(input.reference)}</strong> is</p>
       <p style="font-size:32px;letter-spacing:0.2em;font-weight:700;">${escapeHtml(input.code)}</p>
       <p>It expires in ${input.expiresMinutes} minutes and can be used once.</p>
       <p>If you did not request this code, you can ignore this email.</p>`,
    ),
  };
}

export function bookingCancelledEmail(input: BookingEmailCopy): RenderedEmail {
  const subject = `Booking ${input.reference} cancelled`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    `Booking ${input.reference} has been cancelled. The temporary vehicle hold is no longer active.`,
    `Vehicle: ${input.vehicleLabel}`,
    `Pickup: ${input.pickupLabel}`,
    `Return: ${input.returnLabel}`,
  ].join("\n");

  return {
    template: "booking-cancelled",
    subject,
    text,
    html: wrapHtml(
      "Booking cancelled",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Booking <strong>${escapeHtml(input.reference)}</strong> has been cancelled. The temporary vehicle hold is no longer active.</p>
       <p>Vehicle: ${escapeHtml(input.vehicleLabel)}<br/>Pickup: ${escapeHtml(input.pickupLabel)}<br/>Return: ${escapeHtml(input.returnLabel)}</p>`,
    ),
  };
}

export function bookingExpiredEmail(input: BookingEmailCopy): RenderedEmail {
  const subject = `Booking ${input.reference} expired`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    `Booking ${input.reference} expired because the temporary vehicle hold ended before payment.`,
    "Search availability again if you still want this trip.",
    `Vehicle: ${input.vehicleLabel}`,
    `Pickup: ${input.pickupLabel}`,
    `Return: ${input.returnLabel}`,
  ].join("\n");

  return {
    template: "booking-expired",
    subject,
    text,
    html: wrapHtml(
      "Booking expired",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Booking <strong>${escapeHtml(input.reference)}</strong> expired because the temporary vehicle hold ended before payment.</p>
       <p>Search availability again if you still want this trip.</p>
       <p>Vehicle: ${escapeHtml(input.vehicleLabel)}<br/>Pickup: ${escapeHtml(input.pickupLabel)}<br/>Return: ${escapeHtml(input.returnLabel)}</p>`,
    ),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bookingConfirmedEmail(input: BookingEmailCopy & { amountPaid: number }): RenderedEmail {
  const subject = `Booking ${input.reference} confirmed`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Your reservation is confirmed.",
    "",
    `Reference: ${input.reference}`,
    `Vehicle: ${input.vehicleLabel}`,
    `Pickup: ${input.pickupLabel}`,
    `Return: ${input.returnLabel}`,
    `Amount paid: ${formatGhs(input.amountPaid)}`,
    `Remaining balance: ${formatGhs(input.remainingBalance)}`,
    `Refundable security deposit requirement: ${formatGhs(input.securityDepositRequired)}`,
    "",
    `Retrieve this booking securely: ${input.accessUrl}`,
  ].join("\n");

  return {
    template: "booking-confirmed",
    subject,
    text,
    html: wrapHtml(
      "Booking confirmed",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Your reservation is confirmed.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Vehicle:</strong> ${escapeHtml(input.vehicleLabel)}<br/>
       <strong>Pickup:</strong> ${escapeHtml(input.pickupLabel)}<br/>
       <strong>Return:</strong> ${escapeHtml(input.returnLabel)}<br/>
       <strong>Amount paid:</strong> ${escapeHtml(formatGhs(input.amountPaid))}<br/>
       <strong>Remaining balance:</strong> ${escapeHtml(formatGhs(input.remainingBalance))}<br/>
       <strong>Refundable security deposit requirement:</strong> ${escapeHtml(formatGhs(input.securityDepositRequired))}</p>
       <p>Retrieve this booking securely at <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>.</p>`,
    ),
  };
}

export function paymentReceivedEmail(input: {
  firstName: string;
  reference: string;
  purposeLabel: string;
  amount: number;
  providerReference: string;
  paidAtLabel: string;
  remainingBalance: number;
}): RenderedEmail {
  const subject = `Payment received for booking ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "We received your payment.",
    "",
    `Booking reference: ${input.reference}`,
    `Purpose: ${input.purposeLabel}`,
    `Amount: ${formatGhs(input.amount)}`,
    `Payment reference: ${input.providerReference}`,
    `Payment date: ${input.paidAtLabel}`,
    `Remaining rental balance: ${formatGhs(input.remainingBalance)}`,
  ].join("\n");

  return {
    template: "payment-received",
    subject,
    text,
    html: wrapHtml(
      "Payment received",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>We received your payment.</p>
       <p><strong>Booking reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Purpose:</strong> ${escapeHtml(input.purposeLabel)}<br/>
       <strong>Amount:</strong> ${escapeHtml(formatGhs(input.amount))}<br/>
       <strong>Payment reference:</strong> ${escapeHtml(input.providerReference)}<br/>
       <strong>Payment date:</strong> ${escapeHtml(input.paidAtLabel)}<br/>
       <strong>Remaining rental balance:</strong> ${escapeHtml(formatGhs(input.remainingBalance))}</p>`,
    ),
  };
}

export function vehicleReadyEmail(input: {
  firstName: string;
  reference: string;
  vehicleLabel: string;
  pickupLabel: string;
  accessUrl: string;
}): RenderedEmail {
  const subject = `Your vehicle is ready — booking ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Your vehicle has been prepared and is ready for pickup.",
    "",
    `Reference: ${input.reference}`,
    `Vehicle: ${input.vehicleLabel}`,
    `Pickup: ${input.pickupLabel}`,
    "",
    `View your booking: ${input.accessUrl}`,
  ].join("\n");

  return {
    template: "vehicle-ready",
    subject,
    text,
    html: wrapHtml(
      "Vehicle ready for pickup",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Your vehicle has been prepared and is ready for pickup.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Vehicle:</strong> ${escapeHtml(input.vehicleLabel)}<br/>
       <strong>Pickup:</strong> ${escapeHtml(input.pickupLabel)}</p>
       <p>View your booking at <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>.</p>`,
    ),
  };
}

export function vehicleCollectedEmail(input: {
  firstName: string;
  reference: string;
  vehicleLabel: string;
  returnLabel: string;
  accessUrl: string;
}): RenderedEmail {
  const subject = `Vehicle collected — booking ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Your rental is now in progress. Safe travels.",
    "",
    `Reference: ${input.reference}`,
    `Vehicle: ${input.vehicleLabel}`,
    `Scheduled return: ${input.returnLabel}`,
    "",
    `View your booking: ${input.accessUrl}`,
  ].join("\n");

  return {
    template: "vehicle-collected",
    subject,
    text,
    html: wrapHtml(
      "Vehicle collected",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Your rental is now in progress. Safe travels.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Vehicle:</strong> ${escapeHtml(input.vehicleLabel)}<br/>
       <strong>Scheduled return:</strong> ${escapeHtml(input.returnLabel)}</p>
       <p>View your booking at <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>.</p>`,
    ),
  };
}

export function rentalCompletedEmail(input: {
  firstName: string;
  reference: string;
  vehicleLabel: string;
  accessUrl: string;
}): RenderedEmail {
  const subject = `Rental completed — booking ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Thank you for renting with Nii Plants Car Rental. Your rental is complete.",
    "",
    `Reference: ${input.reference}`,
    `Vehicle: ${input.vehicleLabel}`,
    "",
    `View your booking: ${input.accessUrl}`,
  ].join("\n");

  return {
    template: "rental-completed",
    subject,
    text,
    html: wrapHtml(
      "Rental completed",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Thank you for renting with Nii Plants Car Rental. Your rental is complete.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Vehicle:</strong> ${escapeHtml(input.vehicleLabel)}</p>
       <p>View your booking at <a href="${escapeHtml(input.accessUrl)}">${escapeHtml(input.accessUrl)}</a>.</p>`,
    ),
  };
}

export type EnquiryEmailCopy = {
  firstName: string;
  reference: string;
  serviceLabel: string;
  summaryLines: string[];
  supportEmail?: string;
  supportPhone?: string;
};

export function enquiryReceivedEmail(input: EnquiryEmailCopy): RenderedEmail {
  const subject = `Request received — ${input.reference}`;
  const summary = input.summaryLines.length
    ? `\n\n${input.summaryLines.join("\n")}`
    : "";
  const text = [
    `Hello ${input.firstName},`,
    "",
    "We've received your request and our team will review it.",
    "This is not a confirmed booking yet.",
    "",
    `Reference: ${input.reference}`,
    `Service: ${input.serviceLabel}`,
    summary,
    "",
    input.supportEmail ? `Email us: ${input.supportEmail}` : "",
    input.supportPhone ? `Call us: ${input.supportPhone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    template: "enquiry-received",
    subject,
    text,
    html: wrapHtml(
      "Request received",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>We've received your request and our team will review it.</p>
       <p><strong>This is not a confirmed booking yet.</strong></p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Service:</strong> ${escapeHtml(input.serviceLabel)}</p>
       ${input.summaryLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
       ${input.supportEmail ? `<p>Email us: ${escapeHtml(input.supportEmail)}</p>` : ""}
       ${input.supportPhone ? `<p>Call us: ${escapeHtml(input.supportPhone)}</p>` : ""}`,
    ),
  };
}

export function enquiryStaffNotificationEmail(input: {
  reference: string;
  serviceLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adminUrl: string;
}): RenderedEmail {
  const subject = `New enquiry ${input.reference} — ${input.serviceLabel}`;
  const text = [
    "A new service enquiry was submitted.",
    "",
    `Reference: ${input.reference}`,
    `Service: ${input.serviceLabel}`,
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Phone: ${input.customerPhone}`,
    "",
    `Review in admin: ${input.adminUrl}`,
  ].join("\n");

  return {
    template: "enquiry-staff-notification",
    subject,
    text,
    html: wrapHtml(
      "New enquiry",
      `<p>A new service enquiry was submitted.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Service:</strong> ${escapeHtml(input.serviceLabel)}<br/>
       <strong>Customer:</strong> ${escapeHtml(input.customerName)}<br/>
       <strong>Email:</strong> ${escapeHtml(input.customerEmail)}<br/>
       <strong>Phone:</strong> ${escapeHtml(input.customerPhone)}</p>
       <p><a href="${escapeHtml(input.adminUrl)}">Open enquiry in admin</a></p>`,
    ),
  };
}

export function enquiryQuoteEmail(input: {
  firstName: string;
  reference: string;
  serviceLabel: string;
  quotedAmount: number;
  quoteValidUntil?: string;
  quoteNotes?: string;
  supportEmail?: string;
  supportPhone?: string;
}): RenderedEmail {
  const subject = `Quote for your request — ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "Here is the quote from our team for your service request.",
    "",
    `Reference: ${input.reference}`,
    `Service: ${input.serviceLabel}`,
    `Quoted amount: ${formatGhs(input.quotedAmount)}`,
    input.quoteValidUntil ? `Valid until: ${input.quoteValidUntil}` : "",
    input.quoteNotes ? `Notes: ${input.quoteNotes}` : "",
    "",
    "Reply to this email or contact us to accept or ask questions.",
    input.supportEmail ? `Email: ${input.supportEmail}` : "",
    input.supportPhone ? `Phone: ${input.supportPhone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    template: "enquiry-quote",
    subject,
    text,
    html: wrapHtml(
      "Your service quote",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>Here is the quote from our team for your service request.</p>
       <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Service:</strong> ${escapeHtml(input.serviceLabel)}<br/>
       <strong>Quoted amount:</strong> ${escapeHtml(formatGhs(input.quotedAmount))}</p>
       ${input.quoteValidUntil ? `<p><strong>Valid until:</strong> ${escapeHtml(input.quoteValidUntil)}</p>` : ""}
       ${input.quoteNotes ? `<p>${escapeHtml(input.quoteNotes)}</p>` : ""}
       <p>Reply to this email or contact us to accept or ask questions.</p>`,
    ),
  };
}

export function paymentAvailabilityReviewEmail(input: {
  firstName: string;
  reference: string;
  amount: number;
  providerReference: string;
}): RenderedEmail {
  const subject = `Payment received — availability review for ${input.reference}`;
  const text = [
    `Hello ${input.firstName},`,
    "",
    "We received your payment.",
    "Your booking is not yet confirmed.",
    "Our team is reviewing vehicle availability.",
    "",
    `Booking reference: ${input.reference}`,
    `Amount: ${formatGhs(input.amount)}`,
    `Payment reference: ${input.providerReference}`,
  ].join("\n");

  return {
    template: "payment-received-availability-review",
    subject,
    text,
    html: wrapHtml(
      "Payment received — availability review",
      `<p>Hello ${escapeHtml(input.firstName)},</p>
       <p>We received your payment.</p>
       <p><strong>Your booking is not yet confirmed.</strong> Our team is reviewing vehicle availability.</p>
       <p><strong>Booking reference:</strong> ${escapeHtml(input.reference)}<br/>
       <strong>Amount:</strong> ${escapeHtml(formatGhs(input.amount))}<br/>
       <strong>Payment reference:</strong> ${escapeHtml(input.providerReference)}</p>`,
    ),
  };
}
