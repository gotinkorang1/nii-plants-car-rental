import { expect, test } from "@playwright/test";

const smokeRoutes = [
  { path: "/", heading: /Rent a car in Accra/i },
  { path: "/fleet", heading: /Cars to hire in Accra/i },
  { path: "/book", heading: /Choose your dates/i },
  { path: "/services/chauffeur", heading: /Chauffeur/i },
];

test.describe("cross-browser smoke", () => {
  for (const route of smokeRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }

  test("mobile navigation opens", async ({ page, browserName }) => {
    if (browserName !== "webkit") {
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menu" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    if (browserName === "webkit") {
      // WebKit smoke verifies the mobile menu control renders; menu interaction
      // is covered in Chromium responsive tests (phase9-responsive.spec.ts).
      await expect(menuButton).toHaveAttribute("aria-controls");
      return;
    }
    await expect(
      page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Contact" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("ok");
  });
});
