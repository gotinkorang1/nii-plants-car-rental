import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

test.describe("public marketing site", () => {
  test("homepage loads with navigation and booking entry", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Book a Vehicle" }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Check availability" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "View the fleet" }).click();
    await expect(page).toHaveURL(/\/fleet/);
    await page.goto("/");
    await expectNoSeriousA11yViolations(page, "homepage");
  });

  test("desktop nav reaches fleet and services", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Fleet" }).click();
    await expect(page).toHaveURL(/\/fleet/);
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(
      page.getByRole("heading", { name: "Car hire services in Ghana" }),
    ).toBeVisible();
  });

  test("mobile nav opens and reaches corporate", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Corporate" }).click();
    await expect(page).toHaveURL(/\/corporate/);
    await expect(
      page.getByRole("button", { name: "Request corporate mobility" }),
    ).toBeVisible();
  });

  test("service routes render", async ({ page }) => {
    for (const path of [
      "/services/self-drive",
      "/services/chauffeur",
      "/services/airport-transfer",
      "/services/long-term",
      "/services/events",
    ]) {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto("/services");
    await expectNoSeriousA11yViolations(page, "services");
  });

  test("FAQ accordion works when published questions exist", async ({ page }) => {
    await page.goto("/help/faqs");
    const trigger = page.getByRole("button", { name: /how do i start a self-drive booking/i });

    if ((await trigger.count()) === 0) {
      const firstTrigger = page.locator("[data-slot='accordion-trigger']").first();
      if ((await firstTrigger.count()) === 0) {
        await expect(page.getByText("No published FAQs yet")).toBeVisible();
      } else {
        await firstTrigger.click();
        await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
      }
    } else {
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    }

    await expect(page.getByText("Internal draft: weekend surcharge")).toHaveCount(0);
    await expectNoSeriousA11yViolations(page, "faqs");
  });

  test("contact actions only render configured fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /contact nii plants in accra/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
    await expect(
      page.getByRole("link", { name: /open plantsville on openstreetmap/i }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page, "contact");
  });

  test("privacy and hire terms pages are public", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy notice" })).toBeVisible();
    await expect(page.locator("#main-content")).toContainText("Act 843");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Hire terms" })).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Hire terms", exact: true })).toBeVisible();
    await expect(page.getByText(/Cancel 48 hours or more/)).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Privacy" })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("unpublished CMS draft is not public", async ({ page }) => {
    const response = await page.goto("/internal-policy-draft");
    expect(response?.status()).toBe(404);
  });
});
