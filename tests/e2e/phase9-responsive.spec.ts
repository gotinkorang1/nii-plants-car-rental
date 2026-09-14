import { test, expect } from "@playwright/test";

const MOBILE_WIDTHS = [360, 375, 390, 412, 430] as const;

const OVERFLOW_ROUTES = [
  "/",
  "/fleet",
  "/book",
  "/services/chauffeur",
  "/contact",
  "/corporate",
] as const;

test.describe("phase 9 responsive overflow", () => {
  for (const width of MOBILE_WIDTHS) {
    for (const path of OVERFLOW_ROUTES) {
      test(`${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        );
        expect(overflow).toBe(true);
      });
    }
  }
});

test.describe("phase 9 navigation smoke", () => {
  test("mobile menu stays attached to the viewport over page content", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/fleet");
    await page.getByRole("button", { name: "Menu" }).click();

    const menuPanel = page.locator('[data-testid="mobile-menu-panel"]');
    await expect(menuPanel).toBeVisible();

    await expect
      .poll(() =>
        menuPanel.evaluate((element) => Math.round(element.getBoundingClientRect().top)),
      )
      .toBe(64);

    const geometry = await menuPanel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { bottom: Math.round(rect.bottom), viewportHeight: window.innerHeight };
    });

    expect(geometry.bottom).toBe(geometry.viewportHeight);
  });

  test("skip link focuses main content", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Skip to main content" }).focus();
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("mobile menu includes contact actions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Contact" })).toBeVisible();
  });
});
