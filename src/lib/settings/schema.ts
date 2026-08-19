import { z } from "zod";

export const SITE_SETTING_KEYS = [
  "businessName",
  "phone",
  "whatsapp",
  "email",
  "address",
  "reservationPaymentPercent",
  "balanceDueHours",
  "minimumRentalHours",
  "holdDurationMinutes",
  "quoteDurationMinutes",
  "currency",
  "homepageHeadline",
  "homepageSubheadline",
  "socialLinks",
  "bookingEnabled",
  "onlinePaymentEnabled",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export const socialLinksSchema = z
  .object({
    facebook: z.string().trim().optional(),
    instagram: z.string().trim().optional(),
    x: z.string().trim().optional(),
    linkedin: z.string().trim().optional(),
  })
  .strict();

export const siteSettingsSchema = z.object({
  businessName: z.string().trim().min(1),
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string(),
  address: z.string(),
  reservationPaymentPercent: z.number().int().min(1).max(100),
  balanceDueHours: z.number().int().min(0),
  minimumRentalHours: z.number().int().min(1),
  holdDurationMinutes: z.number().int().min(1),
  quoteDurationMinutes: z.number().int().min(1),
  currency: z.literal("GHS"),
  homepageHeadline: z.string(),
  homepageSubheadline: z.string(),
  socialLinks: socialLinksSchema,
  bookingEnabled: z.boolean(),
  onlinePaymentEnabled: z.boolean(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/** development | preview | production — kill-switch defaults only. */
export type KillSwitchEnvironment = "development" | "preview" | "production";

/**
 * Operational kill switches fail closed in production when unset.
 * Development and preview keep convenient defaults (both enabled) so local
 * and staging work without an explicit site_settings row.
 * Production requires an explicit stored `true` to enable either capability.
 */
export function operationalKillSwitchDefaults(
  environment: KillSwitchEnvironment,
): Pick<SiteSettings, "bookingEnabled" | "onlinePaymentEnabled"> {
  if (environment === "production") {
    return { bookingEnabled: false, onlinePaymentEnabled: false };
  }

  return { bookingEnabled: true, onlinePaymentEnabled: true };
}

function hasOwnSetting(records: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(records, key);
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  businessName: "Nii Plants Car Rentals",
  phone: "+233 59 383 5941",
  whatsapp: "+233 59 383 5941",
  email: "info@niiplantsghana.com",
  address:
    "Plantsville, Poultry Farm Avenue, Akokor Foto, Dansoman, Accra. Office +233 30 244 1805. Monday–Saturday 09:00–17:00; Sunday closed.",
  reservationPaymentPercent: 25,
  balanceDueHours: 24,
  minimumRentalHours: 24,
  holdDurationMinutes: 10,
  quoteDurationMinutes: 15,
  currency: "GHS",
  homepageHeadline: "Rent a car in Accra — self-drive or chauffeur",
  homepageSubheadline:
    "Saloons, SUVs, 4x4s and vans from Plantsville, Dansoman. Collect in Accra or at Kotoka International Airport. Ghana Tourism Authority car-rental awards in 2022 and 2024.",
  socialLinks: {
    facebook: "https://web.facebook.com/niiplants/",
    linkedin: "https://www.linkedin.com/company/nii-plants-car-rental/",
  },
  bookingEnabled: true,
  onlinePaymentEnabled: true,
};

/** @deprecated Use DEFAULT_SITE_SETTINGS. */
export const DEVELOPMENT_SITE_SETTINGS = DEFAULT_SITE_SETTINGS;

export function parseSiteSettingsRecord(
  records: Record<string, unknown>,
  environment: KillSwitchEnvironment = "development",
): SiteSettings {
  const killSwitches = operationalKillSwitchDefaults(environment);

  return siteSettingsSchema.parse({
    ...DEFAULT_SITE_SETTINGS,
    ...records,
    bookingEnabled: hasOwnSetting(records, "bookingEnabled")
      ? records.bookingEnabled
      : killSwitches.bookingEnabled,
    onlinePaymentEnabled: hasOwnSetting(records, "onlinePaymentEnabled")
      ? records.onlinePaymentEnabled
      : killSwitches.onlinePaymentEnabled,
  });
}
