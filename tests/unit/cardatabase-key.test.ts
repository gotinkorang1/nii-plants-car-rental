import { describe, expect, it } from "vitest";

import { readCardatabaseApiKey } from "@/lib/env/cardatabase-key";

describe("readCardatabaseApiKey", () => {
  it("uses CARDATABASE_API_KEY when present", () => {
    expect(
      readCardatabaseApiKey({
        CARDATABASE_API_KEY: "cd_primary",
        CAR_DATABASE_API_KEY: "cd_alias",
      }),
    ).toBe("cd_primary");
  });

  it("falls back to CAR_DATABASE_API_KEY when the documented name is empty", () => {
    expect(
      readCardatabaseApiKey({
        CARDATABASE_API_KEY: "   ",
        CAR_DATABASE_API_KEY: "cd_alias",
      }),
    ).toBe("cd_alias");
  });

  it("returns undefined when neither name is set", () => {
    expect(readCardatabaseApiKey({})).toBeUndefined();
  });
});
