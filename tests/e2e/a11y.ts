import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21aa"] as const;

export type A11yJourney =
  | "homepage"
  | "fleet"
  | "services"
  | "faqs"
  | "contact"
  | "booking-flow"
  | "guest-booking-access"
  | "admin";

/**
 * Shared axe runner for committed Playwright tests.
 * Cover homepage, fleet, booking, guest booking access, and admin as those
 * routes are implemented. Do not weaken assertions to make a check pass.
 */
export async function expectNoSeriousA11yViolations(
  page: Page,
  journey?: A11yJourney,
) {
  const builder = new AxeBuilder({ page }).withTags([...wcagTags]);
  const results = await builder.analyze();
  const serious = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  expect(
    serious,
    formatA11yFailures(serious, journey),
  ).toEqual([]);
}

function formatA11yFailures(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
  journey?: A11yJourney,
) {
  if (violations.length === 0) {
    return "No serious accessibility violations.";
  }

  const heading = journey
    ? `Serious accessibility violations on ${journey}:`
    : "Serious accessibility violations:";

  return [
    heading,
    ...violations.map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    - ${node.target.join(" ")}: ${node.failureSummary}`)
        .join("\n");
      return `- [${violation.impact}] ${violation.id}: ${violation.help}\n${nodes}`;
    }),
  ].join("\n");
}
