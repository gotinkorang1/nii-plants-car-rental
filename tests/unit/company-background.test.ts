import { describe, expect, it } from "vitest";

import { COMPANY, MANAGEMENT } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";

function publicCopyBlob() {
  return [
    JSON.stringify(COMPANY),
    JSON.stringify(MANAGEMENT),
    JSON.stringify(COPY),
  ].join("\n");
}

describe("company background merge", () => {
  it("keeps incorporation under Act 179 and Plantsville as the office", () => {
    expect(COMPANY.incorporationStatute).toContain("Act 179");
    expect(COMPANY.foundedDate).toBe("2007-10-22");
    expect(COMPANY.commencedDate).toBe("2007-10-23");
    expect(COPY.aboutStory).toMatch(/Act 179/);
    expect(COPY.aboutStory).not.toMatch(/Act 169/);
    expect(COPY.aboutStory).toMatch(/Sakaman Junction/);
    expect(COPY.aboutStory).toMatch(/history, not the current desk/);
    expect(COMPANY.streetAddress).toMatch(/Plantsville/);
    expect(COMPANY.email).toBe("info@niiplantsghana.com");
  });

  it("does not publish superseded contact or 2021 staff as current", () => {
    const blob = publicCopyBlob();
    expect(blob).not.toMatch(/hotmail/i);
    expect(blob).not.toMatch(/theo@niiplantsghana\.com/i);
    expect(blob).not.toMatch(/0243452283|024 345 2283/);
    expect(blob).not.toMatch(/0275334888|027 533 4888/);
    expect(blob).not.toMatch(/0307033458|030 703 3458/);
    expect(MANAGEMENT.team.map((member) => member.name).join(" ")).not.toMatch(
      /Abigail|Jacob Akoto/i,
    );
  });

  it("keeps earth-moving and airline ticketing off the car-rental catalogue", () => {
    expect(COPY.objects).toMatch(/NiiPlants Logistics/);
    expect(COPY.concierge).toMatch(/not products on this site/);
    expect(COPY.hirePackages.some((item) => /option to buy/i.test(item.body))).toBe(
      true,
    );
    expect(COPY.values.map((item) => item.title)).toEqual([
      "God factor",
      "Professionalism",
      "Keys to success",
    ]);
  });
});
