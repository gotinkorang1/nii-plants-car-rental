import { expect, test } from "@playwright/test";

import { expectNoSeriousA11yViolations } from "./a11y";
import { waitForOutboxEmail } from "./email-outbox";

test.describe.configure({ mode: "serial" });

test.describe("manual service enquiries", () => {
  test("chauffeur form submits and shows success page", async ({ page }) => {
    await page.goto("/services/chauffeur");

    await page.getByLabel("First name").fill("E2E");
    await page.getByLabel("Last name").fill("Chauffeur");
    await page.getByLabel("Email").fill(`e2e-chauffeur-${Date.now()}@phase8.test`);
    await page.getByLabel("Phone").fill("0241234567");
    await page.getByLabel("Pickup location").fill("Kotoka International Airport");
    await page.getByLabel("Destination").fill("East Legon");
    await page.getByLabel("Pickup date/time").fill("2026-09-01T10:00");
    await page.getByLabel("Passenger count").fill("2");

    await page.getByRole("button", { name: /request chauffeur service/i }).click();
    await expect(page).toHaveURL(/\/enquiry\/complete\/NP-ENQ-/);
    await expect(page.getByRole("heading", { name: /we've received your request/i })).toBeVisible();
    await expect(page.getByText(/NP-ENQ-/)).toBeVisible();
  });

  test("contact form creates general enquiry and sends receipt email", async ({ page }) => {
    const email = `e2e-contact-${Date.now()}@phase8.test`;
    await page.goto("/contact");

    await page.getByLabel("First name").fill("E2E");
    await page.getByLabel("Last name").fill("Contact");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Phone").fill("0247654321");
    await page.getByLabel("Message / special request").fill("Need help choosing a vehicle class.");

    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page).toHaveURL(/\/enquiry\/complete\/NP-ENQ-/);

    const receipt = await waitForOutboxEmail(
      { to: email, template: "enquiry-received" },
      { timeoutMs: 10000 },
    );
    expect(receipt).toBeTruthy();
    expect(receipt?.subject).toMatch(/received/i);
  });

  test("service enquiry pages have no serious WCAG AA violations", async ({ page }) => {
    for (const path of [
      "/services/chauffeur",
      "/services/airport-transfer",
      "/services/long-term",
      "/services/events",
      "/corporate",
      "/contact",
    ]) {
      await page.goto(path);
      await expectNoSeriousA11yViolations(page, path.startsWith("/contact") ? "contact" : "services");
    }
  });

  test("public API rejects tampered status and quote fields", async ({ request }) => {
    const response = await request.post("/api/enquiries", {
      data: {
        serviceType: "general",
        firstName: "Tamper",
        lastName: "Test",
        email: `tamper-${Date.now()}@phase8.test`,
        phone: "0240000001",
        status: "accepted",
        quotedAmount: 1,
        reference: "NP-ENQ-HACK",
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { ok: boolean; reference: string };
    expect(body.ok).toBe(true);
    expect(body.reference).toMatch(/^NP-ENQ-/);
    expect(body.reference).not.toBe("NP-ENQ-HACK");
  });

  test("honeypot submissions are rejected safely", async ({ request }) => {
    const response = await request.post("/api/enquiries", {
      data: {
        serviceType: "general",
        firstName: "Bot",
        lastName: "Spam",
        email: `bot-${Date.now()}@phase8.test`,
        phone: "0240000002",
        companyWebsite: "https://spam.example",
      },
    });
    expect(response.status()).toBe(400);
  });
});
