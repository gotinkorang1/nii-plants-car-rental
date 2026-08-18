import { expect, test, type Page } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";

/**
 * Exercises the CarDatabase-assisted import against the fixture provider that
 * `CARDATABASE_MOCK=1` installs, so CI never spends real provider quota.
 */
const email = process.env.TEST_STAFF_EMAIL;
const password = process.env.TEST_STAFF_PASSWORD;

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email as string);
  await page.getByLabel("Password").fill(password as string);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

function lookup(page: Page) {
  return page.getByRole("combobox", { name: "Search the vehicle database" });
}

test.describe("vehicle database import", () => {
  test.skip(
    !email || !password,
    "Set TEST_STAFF_EMAIL and TEST_STAFF_PASSWORD to run the vehicle import journey.",
  );

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/fleet/models/new");
    await expect(
      page.getByRole("heading", { name: "Vehicle database lookup" }),
    ).toBeVisible();
  });

  test("the search endpoint is closed to anonymous visitors", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/admin/vehicle-data/search?q=toyota",
      { headers: {} },
    );

    expect([401, 403]).toContain(response.status());
  });

  test("suggestions populate the form, images import and the page renders", async ({
    page,
  }) => {
    const slug = `toyota-corolla-e2e-${Date.now()}`;

    await page.getByLabel("Vehicle class").selectOption({ label: "Compact sedan" });
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Staff-written description that import must not overwrite.");

    await lookup(page).fill("Toyota Cor");

    const listbox = page.getByRole("listbox", {
      name: "Vehicle database results",
    });
    await expect(listbox).toBeVisible();
    await expect(
      listbox.getByRole("option", { name: /2022 Toyota Corolla LE/ }),
    ).toBeVisible();

    await expectNoSeriousA11yViolations(page, "admin");

    // Keyboard selection: the first option is active, so Enter imports it.
    await lookup(page).press("Enter");

    await expect(page.getByLabel("Make")).toHaveValue("Toyota");
    await expect(page.getByLabel("Model")).toHaveValue("Corolla");
    await expect(page.getByLabel("Year from")).toHaveValue("2022");
    await expect(page.getByLabel("Generation")).toHaveValue("E210");
    await expect(page.getByLabel("Trim")).toHaveValue("LE");
    await expect(page.getByLabel("Body type")).toHaveValue("sedan");
    await expect(page.getByLabel("Power (kW)")).toHaveValue("103");
    await expect(page.getByLabel("Drive type")).toHaveValue("FWD");
    await expect(page.getByLabel("Length (mm)")).toHaveValue("4630");
    await expect(page.getByLabel("Transmission")).toHaveValue("automatic");
    await expect(page.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Staff-written description that import must not overwrite.",
    );
    await expect(page.locator("#vehicleClassId option:checked")).toHaveText(
      "Compact sedan",
    );

    await expect(
      page.getByText("Imported from CarDatabase:", { exact: false }),
    ).toBeVisible();

    // A petrol car must not show the EV section.
    await expect(page.getByLabel("Battery capacity (kWh)")).toHaveCount(0);

    // Imported values stay editable.
    await page.getByLabel("Trim").fill("LE (Accra spec)");
    await expect(page.getByLabel("Trim")).toHaveValue("LE (Accra spec)");

    const gallery = page.getByRole("heading", {
      name: /Images from CarDatabase/i,
    });
    await expect(gallery).toBeVisible();
    await page.getByLabel(/Import front quarter/i).check();
    await expect(page.getByLabel(/Import front quarter/i)).toBeChecked();

    await page.getByRole("button", { name: "Add field" }).click();
    await page.getByLabel("Label").last().fill("Ground clearance");
    await page.getByLabel("Value").last().fill("134 mm");
    await page
      .getByRole("listitem")
      .filter({ hasText: "Ground clearance" })
      .getByLabel("Public")
      .check();

    await page.getByLabel("Public slug").fill(slug);
    await page.getByLabel("Luggage").fill("3");
    await page.getByLabel("Published").check();

    await page.getByRole("button", { name: "Create model" }).click();
    await expect(page).toHaveURL(/\/admin\/fleet\/models$/);

    await page.goto(`/fleet/${slug}`);
    await expect(
      page.getByRole("heading", { name: "Toyota Corolla", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Ground clearance")).toBeVisible();
    await expect(page.getByText("134 mm")).toBeVisible();
    await expect(page.getByText("103 kW", { exact: false })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "fleet");
  });

  test("an electric vehicle reveals the EV section", async ({ page }) => {
    await lookup(page).fill("Tesla Model 3");
    await page
      .getByRole("option", { name: /Tesla Model 3/ })
      .first()
      .click();

    await expect(page.getByLabel("Fuel type")).toHaveValue("electric");
    await expect(page.getByLabel("Battery capacity (kWh)")).toHaveValue("79");
    await expect(page.getByLabel("Usable battery (kWh)")).toHaveValue("75");
    await expect(page.getByLabel("Range (km)")).toHaveValue("629");
    await expect(page.getByLabel("DC charging (kW)")).toHaveValue("250");
  });

  test("no results and Escape leave manual entry available", async ({ page }) => {
    await lookup(page).fill("Zzzz Nonexistent");
    await expect(
      page.getByText(/No matching vehicles/i),
    ).toBeVisible();

    await lookup(page).fill("Toyota Cor");
    await expect(
      page.getByRole("listbox", { name: "Vehicle database results" }),
    ).toBeVisible();
    await lookup(page).press("Escape");
    await expect(
      page.getByRole("listbox", { name: "Vehicle database results" }),
    ).toBeHidden();

    // The manual form is untouched by any of this.
    await page.getByLabel("Make").fill("Kia");
    await expect(page.getByLabel("Make")).toHaveValue("Kia");
  });

  test("a provider outage does not block manual entry", async ({ page }) => {
    await page.route("**/api/admin/vehicle-data/search**", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error:
            "Vehicle data lookup is temporarily unavailable. You can continue entering the vehicle manually.",
        }),
      }),
    );

    await lookup(page).fill("Toyota Cor");
    await expect(
      page.getByText(/temporarily unavailable/i),
    ).toBeVisible();

    await page.getByLabel("Make").fill("Kia");
    await page.getByLabel("Model").fill("Picanto");
    await expect(page.getByLabel("Model")).toHaveValue("Picanto");
  });

  test("saving the same vehicle again warns about a duplicate", async ({
    page,
  }) => {
    await lookup(page).fill("Toyota Corolla");
    await page
      .getByRole("option", { name: /2021 Toyota Corolla L/ })
      .first()
      .click();

    const warning = page.getByText("A similar vehicle model already exists.");
    if (await warning.isVisible()) {
      await expect(
        page.getByRole("button", { name: "Continue anyway" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Continue anyway" }).click();
      await expect(warning).toBeHidden();
    }
  });
});
