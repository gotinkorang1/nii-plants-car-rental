import type { SiteSettings } from "@/lib/settings/schema";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/schema";
import catalog from "@/lib/db/seed-catalog.json";

export const seedLocations = catalog.locations;

export const seedVehicleClasses = catalog.vehicleClasses;

export const seedVehicleModels = catalog.vehicleModels;

export const seedSiteSettings: SiteSettings = DEFAULT_SITE_SETTINGS;

export const seedFaqs = catalog.faqs;

export const seedContentPages = catalog.contentPages;

export const seedExtras = catalog.extras ?? [];

export const seedPromotions = catalog.promotions ?? [];

export const seedPhysicalVehicles = catalog.physicalVehicles ?? [];

/** @deprecated Use seedLocations. */
export const developmentLocations = seedLocations;
/** @deprecated Use seedVehicleClasses. */
export const developmentVehicleClasses = seedVehicleClasses;
/** @deprecated Use seedVehicleModels. */
export const developmentVehicleModels = seedVehicleModels;
/** @deprecated Use seedSiteSettings. */
export const developmentSiteSettings = seedSiteSettings;
/** @deprecated Use seedFaqs. */
export const developmentFaqs = seedFaqs;
/** @deprecated Use seedContentPages. */
export const developmentContentPages = seedContentPages;
