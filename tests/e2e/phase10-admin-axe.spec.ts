import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

const CI_STAFF_EMAIL = process.env.TEST_STAFF_EMAIL ?? "ci-admin@example.test";
const CI_STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD ?? "Ci-Staff-Password-123!";

async function loginAsStaff(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(CI_STAFF_EMAIL);
  await page.getByLabel("Password").fill(CI_STAFF_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function axeAdminRoute(page: import("@playwright/test").Page, path: string, heading: RegExp | string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  await expectNoSeriousA11yViolations(page, "admin");
}

test.describe("phase 10 authenticated admin accessibility", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.DATABASE_URL,
      "DATABASE_URL is required for authenticated admin accessibility checks.",
    );
    await loginAsStaff(page);
  });

  test("dashboard", async ({ page }) => {
    await expectNoSeriousA11yViolations(page, "admin");
  });

  test("bookings list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/bookings", "Bookings");
  });

  test("customers list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/customers", "Customers");
  });

  test("payments list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/payments", "Payments");
  });

  test("security deposits list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/deposits", "Security deposits");
  });

  test("enquiries list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/enquiries", "Enquiries");
  });

  test("fleet vehicles list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/fleet/vehicles", "Physical vehicles");
  });

  test("availability", async ({ page }) => {
    await axeAdminRoute(page, "/admin/availability", "Availability");
  });

  test("daily rates", async ({ page }) => {
    await axeAdminRoute(page, "/admin/rates", "Daily rates");
  });

  test("maintenance list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/maintenance", "Maintenance");
  });

  test("staff list", async ({ page }) => {
    await axeAdminRoute(page, "/admin/staff", "Staff");
  });

  test("booking detail and operations when records exist", async ({ page }) => {
    await page.goto("/admin/bookings");
    const bookingLink = page.locator('main a[href^="/admin/bookings/"]').first();
    if ((await bookingLink.count()) === 0) {
      test.skip(true, "No bookings in database for detail/pickup/return axe checks.");
    }
    await bookingLink.click();
    await expect(page.getByRole("heading", { name: /Booking / })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    const pickupLink = page.getByRole("link", { name: "Process pickup" });
    if (await pickupLink.isVisible()) {
      await pickupLink.click();
      await expect(page.getByRole("heading", { name: /Pickup/i })).toBeVisible();
      await expectNoSeriousA11yViolations(page, "admin");
      await page.goBack();
    }

    const returnLink = page.getByRole("link", { name: "Process return" });
    if (await returnLink.isVisible()) {
      await returnLink.click();
      await expect(page.getByRole("heading", { name: /Return/i })).toBeVisible();
      await expectNoSeriousA11yViolations(page, "admin");
    }
  });

  test("payment detail when records exist", async ({ page }) => {
    await page.goto("/admin/payments");
    const paymentLink = page.locator('main a[href^="/admin/payments/"]').first();
    if ((await paymentLink.count()) === 0) {
      test.skip(true, "No payments in database for payment detail axe check.");
    }
    await paymentLink.click();
    await expect(page.getByRole("heading", { name: /Payment /i })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });

  test("customer detail when records exist", async ({ page }) => {
    await page.goto("/admin/customers");
    const customerLink = page.locator('main a[href^="/admin/customers/"]').first();
    if ((await customerLink.count()) === 0) {
      test.skip(true, "No customers in database for customer detail axe check.");
    }
    await customerLink.click();
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });

  test("security deposit detail when records exist", async ({ page }) => {
    await page.goto("/admin/deposits");
    const depositLink = page.locator('main a[href^="/admin/deposits/"]').first();
    if ((await depositLink.count()) === 0) {
      test.skip(true, "No security deposits in database for deposit detail axe check.");
    }
    await depositLink.click();
    await expect(page.getByRole("heading", { name: "Deposit record" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });

  test("enquiry detail when records exist", async ({ page }) => {
    await page.goto("/admin/enquiries");
    const enquiryLink = page.locator('main a[href^="/admin/enquiries/"]').first();
    if ((await enquiryLink.count()) === 0) {
      test.skip(true, "No enquiries in database for enquiry detail axe check.");
    }
    await enquiryLink.click();
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });
});
