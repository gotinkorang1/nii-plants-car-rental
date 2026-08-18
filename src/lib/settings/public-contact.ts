import type { SiteSettings } from "@/lib/settings/schema";

export type PublicContact = {
  businessName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  homepageHeadline: string;
  homepageSubheadline: string;
  socialLinks: SiteSettings["socialLinks"];
  reservationPaymentPercent: number;
  minimumRentalHours: number;
};

export function toPublicContact(settings: SiteSettings): PublicContact {
  return {
    businessName: settings.businessName,
    phone: settings.phone.trim() || undefined,
    whatsapp: settings.whatsapp.trim() || undefined,
    email: settings.email.trim() || undefined,
    address: settings.address.trim() || undefined,
    homepageHeadline: settings.homepageHeadline,
    homepageSubheadline: settings.homepageSubheadline,
    socialLinks: settings.socialLinks,
    reservationPaymentPercent: settings.reservationPaymentPercent,
    minimumRentalHours: settings.minimumRentalHours,
  };
}

export function whatsappHref(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function mailHref(email: string): string {
  return `mailto:${email}`;
}
