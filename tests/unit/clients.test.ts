import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CLIENTS } from "@/lib/content/clients";

describe("clientele logos", () => {
  it("lists the published Management-page organisations with files on disk", () => {
    const names = CLIENTS.map((client) => client.name);
    expect(names).toEqual([
      "ABB",
      "Zenith",
      "Vitol",
      "USAID",
      "University of Ghana",
      "Saladin Ghana",
      "Promasidor",
      "Oloam",
      "MTN",
      "FAO",
      "DEME",
      "Bosch",
    ]);
    expect(new Set(names).size).toBe(names.length);

    for (const client of CLIENTS) {
      expect(client.src.startsWith("/images/clientele/")).toBe(true);
      const filePath = path.join(process.cwd(), "public", client.src.replace(/^\//, ""));
      expect(existsSync(filePath), filePath).toBe(true);
    }
  });
});
