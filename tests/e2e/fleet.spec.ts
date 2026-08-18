import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

const internalStrings = [
  "DEV-UNIT-001",
  "GR-DEV-0001",
  "INTERNAL-FLEET-NOTE-DEV",
  "NP-UNIT-001",
  "INTERNAL-UNSET-001",
];

test.describe("public fleet", () => {
  test("opens /fleet, filters, and has no serious WCAG AA violations", async ({
    page,
  }) => {
    await page.goto("/fleet");
    await expect(
      page.getByRole("heading", {
        name: "Cars to hire in Accra: saloons, SUVs, 4x4s and coaches",
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Vehicle class")).toBeVisible();

    await page.getByLabel("Minimum seats").fill("5");
    await page.getByRole("button", { name: "Filter fleet" }).click();
    await expect(page).toHaveURL(/seats=5/);

    const body = await page.locator("body").innerText();
    for (const value of internalStrings) {
      expect(body).not.toContain(value);
    }

    await expectNoSeriousA11yViolations(page, "fleet");
  });

  test("returns 404 for unpublished or missing models", async ({ page }) => {
    const response = await page.goto("/fleet/hyundai-h1");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();

    const missing = await page.goto("/fleet/this-model-does-not-exist-xyz");
    expect(missing?.status()).toBe(404);
  });

  test("model detail shows specifications and hides internal unit data", async ({
    page,
  }) => {
    await page.goto("/fleet");
    const details = page.getByRole("link", { name: "View vehicle" }).first();

    if ((await details.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description:
          "No published models in this environment. Catalogue empty state is expected without DATABASE_URL/seed.",
      });
      return;
    }

    await details.click();
    const main = page.getByRole("main");
    await expect(main.getByText("Seats", { exact: true }).first()).toBeVisible();
    await expect(main.getByText("Transmission", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("this model or similar", { exact: false }),
    ).toBeVisible();

    const body = await page.locator("body").innerText();
    for (const value of internalStrings) {
      expect(body).not.toContain(value);
    }
    expect(body.toLowerCase()).not.toContain("internal code");
    expect(body.toLowerCase()).not.toContain("registration number");

    await expectNoSeriousA11yViolations(page, "fleet");
  });

  test("fleet cards remain usable from 360px through desktop widths", async ({
    page,
  }) => {
    await page.goto("/fleet");

    for (const width of [360, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(
        page.getByRole("heading", {
          name: "Cars to hire in Accra: saloons, SUVs, 4x4s and coaches",
        }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Filter fleet" })).toBeVisible();
    }
  });
});
