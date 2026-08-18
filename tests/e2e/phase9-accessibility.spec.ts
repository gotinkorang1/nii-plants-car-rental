import { test, expect } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

const PUBLIC_AXE_ROUTES = [
  { path: "/", journey: "homepage" as const },
  { path: "/fleet", journey: "fleet" as const },
  { path: "/services", journey: "services" as const },
  { path: "/services/self-drive", journey: "services" as const },
  { path: "/services/chauffeur", journey: "services" as const },
  { path: "/services/airport-transfer", journey: "services" as const },
  { path: "/services/long-term", journey: "services" as const },
  { path: "/services/events", journey: "services" as const },
  { path: "/corporate", journey: "services" as const },
  { path: "/about", journey: "services" as const },
  { path: "/help", journey: "faqs" as const },
  { path: "/help/faqs", journey: "faqs" as const },
  { path: "/contact", journey: "contact" as const },
  { path: "/book", journey: "booking-flow" as const },
  { path: "/booking", journey: "guest-booking-access" as const },
  { path: "/booking/verify", journey: "guest-booking-access" as const },
] as const;

test.describe("phase 9 public accessibility", () => {
  for (const route of PUBLIC_AXE_ROUTES) {
    test(`${route.path} has no serious WCAG AA violations`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.ok()).toBeTruthy();
      await expectNoSeriousA11yViolations(page, route.journey);
    });
  }

  test("branded 404 page has no serious violations", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-phase9");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "homepage");
  });
});
