import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

test.describe("admin authentication", () => {
  test("login page has no serious WCAG AA violations", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });

  test("unauthenticated visitors are kept out of the admin dashboard", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("CMS pages require authentication", async ({ page }) => {
    await page.goto("/admin/content/pages");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/content/faqs");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/settings/site");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("authenticated admin shell has no serious WCAG AA violations", async ({
    page,
  }) => {
    const email = process.env.TEST_STAFF_EMAIL;
    const password = process.env.TEST_STAFF_PASSWORD;
    test.skip(
      !email || !password,
      "Set TEST_STAFF_EMAIL and TEST_STAFF_PASSWORD to run the authenticated admin shell check.",
    );

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email as string);
    await page.getByLabel("Password").fill(password as string);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Vehicle Classes" }).click();
    await expect(page.getByRole("heading", { name: "Vehicle classes" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Vehicle Models" }).click();
    await expect(page.getByRole("heading", { name: "Vehicle models" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Vehicles" }).click();
    await expect(page.getByRole("heading", { name: "Physical vehicles" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Pages" }).click();
    await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Availability" }).click();
    await expect(page.getByRole("heading", { name: "Availability" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");

    await page.getByRole("link", { name: "Bookings" }).click();
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "admin");
  });
});
