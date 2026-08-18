import { config } from "dotenv";
import postgres from "postgres";

import { getRuntimeEnvironment } from "./lib/runtime-environment.mjs";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

if (getRuntimeEnvironment() !== "production" && process.env.BOOTSTRAP_FORCE !== "1") {
  console.error(
    "Production bootstrap is intended for APP_ENV=production or VERCEL_ENV=production.",
  );
  console.error("Set BOOTSTRAP_FORCE=1 only when deliberately bootstrapping staging.");
  process.exit(1);
}

/** Minimal approved defaults — no demo fleet, tariffs, vehicles, or promotions. */
const bootstrapSiteSettings = {
  businessName: "Nii Plants Car Rentals",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  reservationPaymentPercent: 25,
  balanceDueHours: 24,
  minimumRentalHours: 24,
  holdDurationMinutes: 10,
  quoteDurationMinutes: 15,
  currency: "GHS",
  homepageHeadline: "",
  homepageSubheadline: "",
  socialLinks: {},
  bookingEnabled: false,
  onlinePaymentEnabled: false,
};

const sql = postgres(databaseUrl, { max: 1 });

async function bootstrap() {
  console.log("Bootstrapping production-safe site settings only.");

  for (const [key, value] of Object.entries(bootstrapSiteSettings)) {
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES (${key}, ${sql.json(value)})
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `;
  }

  console.log(
    "Bootstrap complete. Configure contact details, fleet, rates, and operational switches in admin before launch.",
  );
}

bootstrap()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 1 });
  });
