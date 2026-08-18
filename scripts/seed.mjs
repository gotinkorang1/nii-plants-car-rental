import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import postgres from "postgres";

import { assertDevelopmentSeedAllowed } from "./lib/runtime-environment.mjs";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "DATABASE_URL is required to seed data. Copy .env.example to .env.local first.",
  );
  process.exit(1);
}

try {
  assertDevelopmentSeedAllowed(databaseUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/lib/db/seed-catalog.json",
);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const siteSettings = {
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
    "Sedans, SUVs, 4x4s and vans from Plantsville, Dansoman. Kotoka pickup by arrangement. GTA car-rental awards in 2022 and 2024.",
  socialLinks: {
    facebook: "https://web.facebook.com/niiplants/",
    linkedin: "https://www.linkedin.com/company/nii-plants-car-rental/",
  },
};

async function seed() {
  console.log("Seeding Nii Plants catalogue, FAQs, and site settings.");

  await sql`
    UPDATE vehicle_models
    SET published = false
    WHERE slug LIKE '%-dev' OR slug LIKE '%unpublished-hatch%'
  `;
  await sql`
    UPDATE vehicle_classes
    SET active = false
    WHERE slug LIKE '%-dev'
  `;
  await sql`
    UPDATE faqs
    SET published = false
    WHERE question LIKE '%(development)%'
  `;
  await sql`
    UPDATE content_pages
    SET published = false
    WHERE slug LIKE '%-dev'
  `;

  for (const [key, value] of Object.entries(siteSettings)) {
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES (${key}, ${sql.json(value)})
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `;
  }

  for (const location of catalog.locations) {
    await sql`
      INSERT INTO locations (name, slug, type, address, active)
      VALUES (
        ${location.name},
        ${location.slug},
        ${location.type},
        ${location.address},
        ${location.active}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        address = excluded.address,
        active = excluded.active
    `;
  }

  for (const vehicleClass of catalog.vehicleClasses) {
    await sql`
      INSERT INTO vehicle_classes (
        name,
        slug,
        description,
        seats,
        luggage,
        transmission,
        default_daily_rate,
        default_security_deposit,
        active
      )
      VALUES (
        ${vehicleClass.name},
        ${vehicleClass.slug},
        ${vehicleClass.description},
        ${vehicleClass.seats},
        ${vehicleClass.luggage},
        ${vehicleClass.transmission},
        ${vehicleClass.defaultDailyRate},
        ${vehicleClass.defaultSecurityDeposit},
        ${vehicleClass.active}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        seats = excluded.seats,
        luggage = excluded.luggage,
        transmission = excluded.transmission,
        default_daily_rate = excluded.default_daily_rate,
        default_security_deposit = excluded.default_security_deposit,
        active = excluded.active
    `;
  }

  for (const model of catalog.vehicleModels) {
    await sql`
      INSERT INTO vehicle_models (
        vehicle_class_id,
        make,
        model,
        slug,
        year_from,
        year_to,
        description,
        seats,
        doors,
        transmission,
        fuel_type,
        luggage,
        air_conditioning,
        featured,
        published
      )
      SELECT
        vehicle_classes.id,
        ${model.make},
        ${model.model},
        ${model.slug},
        ${model.yearFrom ?? null},
        ${model.yearTo ?? null},
        ${model.description},
        ${model.seats},
        ${model.doors},
        ${model.transmission},
        ${model.fuelType},
        ${model.luggage},
        ${model.airConditioning},
        ${model.featured},
        ${model.published}
      FROM vehicle_classes
      WHERE vehicle_classes.slug = ${model.classSlug}
      ON CONFLICT (slug) DO UPDATE SET
        make = excluded.make,
        model = excluded.model,
        year_from = excluded.year_from,
        year_to = excluded.year_to,
        description = excluded.description,
        seats = excluded.seats,
        doors = excluded.doors,
        transmission = excluded.transmission,
        fuel_type = excluded.fuel_type,
        luggage = excluded.luggage,
        air_conditioning = excluded.air_conditioning,
        featured = excluded.featured,
        published = excluded.published
    `;
  }

  for (const faq of catalog.faqs) {
    await sql`
      INSERT INTO faqs (question, answer, category, sort_order, published)
      SELECT
        ${faq.question},
        ${faq.answer},
        ${faq.category},
        ${faq.sortOrder},
        ${faq.published}
      WHERE NOT EXISTS (
        SELECT 1 FROM faqs WHERE question = ${faq.question}
      )
    `;
    await sql`
      UPDATE faqs
      SET
        answer = ${faq.answer},
        category = ${faq.category},
        sort_order = ${faq.sortOrder},
        published = ${faq.published}
      WHERE question = ${faq.question}
    `;
  }

  for (const page of catalog.contentPages) {
    await sql`
      INSERT INTO content_pages (
        title,
        slug,
        excerpt,
        body,
        seo_title,
        seo_description,
        published,
        published_at
      )
      VALUES (
        ${page.title},
        ${page.slug},
        ${page.excerpt},
        ${page.body},
        ${page.seoTitle ?? null},
        ${page.seoDescription ?? null},
        ${page.published},
        ${page.published ? new Date() : null}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        body = excluded.body,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        published = excluded.published,
        published_at = excluded.published_at
    `;
  }

  for (const extra of catalog.extras ?? []) {
    await sql`
      INSERT INTO extras (name, description, price, pricing_type, active)
      VALUES (
        ${extra.name},
        ${extra.description},
        ${extra.price},
        ${extra.pricingType},
        ${extra.active}
      )
      ON CONFLICT (name) DO UPDATE SET
        description = excluded.description,
        price = excluded.price,
        pricing_type = excluded.pricing_type,
        active = excluded.active
    `;
  }

  for (const promotion of catalog.promotions ?? []) {
    await sql`
      INSERT INTO promotions (
        code,
        type,
        value,
        active,
        starts_at,
        ends_at,
        max_uses,
        usage_count
      )
      VALUES (
        ${promotion.code},
        ${promotion.type},
        ${promotion.value},
        ${promotion.active},
        ${promotion.startsAt},
        ${promotion.endsAt},
        ${promotion.maxUses},
        ${promotion.usageCount}
      )
      ON CONFLICT (code) DO UPDATE SET
        type = excluded.type,
        value = excluded.value,
        active = excluded.active,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        max_uses = excluded.max_uses,
        usage_count = excluded.usage_count
    `;
  }

  for (const vehicle of catalog.physicalVehicles ?? []) {
    await sql`
      INSERT INTO vehicles (
        vehicle_model_id,
        vehicle_class_id,
        internal_code,
        registration_number,
        colour,
        current_mileage,
        status,
        branch_location_id,
        notes
      )
      SELECT
        vehicle_models.id,
        vehicle_models.vehicle_class_id,
        ${vehicle.internalCode},
        ${vehicle.registrationNumber},
        ${vehicle.colour},
        ${vehicle.currentMileage},
        ${vehicle.status},
        locations.id,
        ${vehicle.notes}
      FROM vehicle_models
      INNER JOIN locations
        ON locations.slug = ${vehicle.locationSlug}
      WHERE vehicle_models.slug = ${vehicle.modelSlug}
      ON CONFLICT (internal_code) DO UPDATE SET
        registration_number = excluded.registration_number,
        colour = excluded.colour,
        current_mileage = excluded.current_mileage,
        status = excluded.status,
        notes = excluded.notes
    `;
  }

  await sql.end();

  console.log(
    "Seed complete. Self-drive class rates are development placeholders in pesewas, not live tariffs.",
  );
  console.log(
    "Physical vehicles use INTERNAL-UNSET registrations, not live plates.",
  );
  console.log("");
  console.log("Create a staff user manually:");
  console.log("1. In the Supabase dashboard, create an Auth user.");
  console.log("2. Insert a matching staff_profiles row, for example:");
  console.log(`
INSERT INTO staff_profiles (auth_user_id, display_name, email, role, active)
VALUES (
  '<auth-user-uuid>',
  'Administrator',
  '<staff-email>',
  'administrator',
  true
);
`);
}

seed().catch(async (error) => {
  console.error(error);
  await sql.end({ timeout: 1 });
  process.exit(1);
});
