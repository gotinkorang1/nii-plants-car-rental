import { test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

test.describe("accessibility", () => {
  test("homepage has no serious WCAG AA violations", async ({ page }) => {
    await page.goto("/");
    await expectNoSeriousA11yViolations(page, "homepage");
  });

  test("services, FAQs, and contact have no serious WCAG AA violations", async ({
    page,
  }) => {
    await page.goto("/services");
    await expectNoSeriousA11yViolations(page, "services");
    await page.goto("/help/faqs");
    await expectNoSeriousA11yViolations(page, "faqs");
    await page.goto("/contact");
    await expectNoSeriousA11yViolations(page, "contact");
    await page.goto("/book");
    await expectNoSeriousA11yViolations(page, "booking-flow");
    await page.goto("/booking");
    await expectNoSeriousA11yViolations(page, "guest-booking-access");
  });
});
