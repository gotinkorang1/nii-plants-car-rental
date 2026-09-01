import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";
import { latestCapturedOtp } from "./email-outbox";

function futureTrip(daysAhead = 14) {
  const pickup = new Date();
  pickup.setUTCDate(pickup.getUTCDate() + daysAhead);
  pickup.setUTCHours(10, 0, 0, 0);
  const dropoff = new Date(pickup);
  dropoff.setUTCDate(dropoff.getUTCDate() + 2);
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  return {
    pickupDate: iso(pickup),
    returnDate: iso(dropoff),
    pickupTime: "10:00",
    returnTime: "10:00",
  };
}

async function locationCount(page: {
  locator: (selector: string) => { count: () => Promise<number> };
}) {
  return page.locator("#pickup option").count();
}

test.describe("self-drive booking", () => {
  test("search, results, extras, and quote stay accessible", async ({ page }) => {
    const trip = futureTrip();
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: "Choose your dates" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");

    if ((await locationCount(page)) < 2) {
      await page.getByRole("button", { name: "Check availability" }).click();
      await expect(page.getByRole("alert")).toBeVisible();
      return;
    }

    await page.getByLabel("Pickup location").selectOption({ index: 1 });
    await page.getByLabel("Pickup date").fill(trip.pickupDate);
    await page.getByLabel("Pickup time").fill(trip.pickupTime);
    await page.getByLabel("Return date").fill(trip.returnDate);
    await page.getByLabel("Return time").fill(trip.returnTime);
    await page.getByRole("button", { name: "Check availability" }).click();

    await expect(page).toHaveURL(/\/book\/vehicle/);
    await expect(page.getByRole("heading", { name: "Choose a vehicle" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");

    const selectVehicle = page.getByRole("link", { name: "Select vehicle" }).first();
    if ((await selectVehicle.count()) === 0) {
      await expect(
        page.getByRole("heading", {
          name: "No vehicles are available for these dates.",
        }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Change dates" })).toBeVisible();
      return;
    }

    await selectVehicle.click();
    await expect(page.getByText("Extras")).toBeVisible();
    await page.getByLabel("Promo code").fill("NII10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Promotion applied")).toBeVisible();
    await page.getByRole("button", { name: "Secure this quote" }).click();
    await expect(page.getByRole("heading", { name: "Rental summary" })).toBeVisible();
    await expect(page.getByText("Reservation payment")).toBeVisible();
    await expect(page.getByText("Refundable security deposit")).toBeVisible();
    await expect(page.getByText("Deposit", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Continue to details" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");
  });

  test("customer details create a payment-pending booking, not a confirmation", async ({
    page,
  }) => {
    const trip = futureTrip(18);
    await page.goto("/book");
    if ((await locationCount(page)) < 2) {
      await page.getByRole("button", { name: "Check availability" }).click();
      await expect(page.getByRole("alert")).toBeVisible();
      return;
    }

    await page.getByLabel("Pickup location").selectOption({ index: 1 });
    await page.getByLabel("Pickup date").fill(trip.pickupDate);
    await page.getByLabel("Pickup time").fill(trip.pickupTime);
    await page.getByLabel("Return date").fill(trip.returnDate);
    await page.getByLabel("Return time").fill(trip.returnTime);
    await page.getByRole("button", { name: "Check availability" }).click();
    await expect(page).toHaveURL(/\/book\/vehicle/);
    await expect(page.getByRole("heading", { name: "Choose a vehicle" })).toBeVisible();
    const selectVehicle = page.getByRole("link", { name: "Select vehicle" }).first();
    if ((await selectVehicle.count()) === 0) {
      await expect(
        page.getByRole("heading", {
          name: "No vehicles are available for these dates.",
        }),
      ).toBeVisible();
      return;
    }
    await selectVehicle.click();
    await page.getByRole("button", { name: "Secure this quote" }).click();
    await page.getByRole("link", { name: "Continue to details" }).click();
    await expect(page).toHaveURL(/\/book\/details/);
    await expect(page.getByRole("heading", { name: "Complete your booking" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");

    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByLabel("First name")).toBeVisible();
      await expect(page.getByRole("button", { name: "Create booking" })).toBeVisible();
    }
    await page.setViewportSize({ width: 1280, height: 800 });

    const email = `e2e-${Date.now()}@example.com`;
    await page.getByLabel("First name").fill("Ama");
    await page.getByLabel("Last name").fill("Mensah");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Phone").fill("0241234567");
    await page.getByLabel("Driver age").fill("32");
    await page.getByLabel("Licence country").fill("Ghana");
    await page.getByRole("button", { name: "Create booking" }).click();
    await expect(page).toHaveURL(/\/book\/complete\//, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Payment required" })).toBeVisible();
    await expect(page.getByText("Your booking request has been created.")).toBeVisible();
    await expect(page.getByText("Your booking is confirmed.")).toHaveCount(0);
    await expect(page.getByText("Payment successful.")).toHaveCount(0);
    await expect(
      page.getByLabel("Booking", { exact: true }).getByText("Payment required"),
    ).toBeVisible();
    await expect(page.getByText("Amount paid")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pay reservation" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");

    const reference = ((await page.locator("p.mt-2.font-medium.tracking-wide").textContent()) ?? "").trim();
    expect(reference).toMatch(/^NP-/);

    await page.getByRole("button", { name: "Sign out of booking" }).click();
    await expect(page).toHaveURL(/\/booking$/);
    await page.goto(`/booking/${reference}`);
    await expect(page.getByRole("heading", { name: "Access your booking" })).toBeVisible();
    await expect(
      page.getByLabel("Booking", { exact: true }).getByText("Payment required"),
    ).toHaveCount(0);
    await expect(page.getByLabel("Booking reference")).toBeVisible();
    await expectNoSeriousA11yViolations(page, "guest-booking-access");

    await page.getByLabel("Booking reference").fill(reference);
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByRole("button", { name: "Access booking" }).click();
    await expect(
      page.getByText("If the booking details match our records", { exact: false }),
    ).toBeVisible();

    await page.goto("/booking");
    await page.getByLabel("Booking reference").fill(reference);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Access booking" }).click();
    await expect(page).toHaveURL(/\/booking\/verify/);
    await expect(page.getByLabel("6-digit verification code")).toBeVisible();
    await expectNoSeriousA11yViolations(page, "guest-booking-access");

    await expect
      .poll(() => latestCapturedOtp(email, reference), { timeout: 10_000 })
      .toMatch(/^\d{6}$/);
    const otp = latestCapturedOtp(email, reference);
    await page.getByLabel("6-digit verification code").fill(otp as string);
    await page.getByRole("button", { name: "Verify code" }).click();
    await expect(page).toHaveURL(new RegExp(`/booking/${reference}`));
    await expect(page.getByRole("heading", { name: reference })).toBeVisible();
    await expect(
      page.getByLabel("Booking", { exact: true }).getByText("Payment required"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Pay reservation" })).toBeVisible();
    await page.getByRole("button", { name: "Pay reservation" }).click();
    await expect(page).toHaveURL(/\/payment\/(callback|mock\/checkout)/, { timeout: 20_000 });
    await expect(page.getByText("Payment received.", { exact: false })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("link", { name: "View booking" }).click();
    await expect(
      page.getByLabel("Booking", { exact: true }).getByText("Confirmed"),
    ).toBeVisible({ timeout: 20_000 });
    await expectNoSeriousA11yViolations(page, "guest-booking-access");
  });

  test("invalid date range shows accessible validation", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Check availability" }).click();
    await expect(
      page.getByRole("form", { name: "Check availability" }).getByRole("alert"),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page, "booking-flow");

    if ((await locationCount(page)) < 2) {
      return;
    }

    await page.getByLabel("Pickup location").selectOption({ index: 1 });
    await page.getByLabel("Pickup date").fill("2026-08-20");
    await page.getByLabel("Pickup time").fill("10:00");
    await page.getByLabel("Return date").fill("2026-08-20");
    await page.getByLabel("Return time").fill("10:00");
    await page.getByRole("button", { name: "Check availability" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("booking cards remain usable at mobile widths", async ({ page }) => {
    await page.goto("/book");

    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(page.getByLabel("Pickup date")).toBeVisible();
      await expect(page.getByRole("button", { name: "Check availability" })).toBeVisible();
    }
  });
});
