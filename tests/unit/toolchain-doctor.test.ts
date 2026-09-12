import { describe, expect, it } from "vitest";

import {
  evaluateRequirement,
  parseMajor,
  requiresShell,
  summarizeChecks,
} from "../../scripts/toolchain-doctor.mjs";

describe("toolchain doctor", () => {
  it("extracts a major version from common CLI output", () => {
    expect(parseMajor("v24.19.0")).toBe(24);
    expect(parseMajor("Docker version 29.6.2, build abc123")).toBe(29);
    expect(parseMajor("unknown")).toBeNull();
  });

  it("marks required tools as failed when they are missing or outdated", () => {
    expect(evaluateRequirement("Node.js", null, 24)).toMatchObject({
      ok: false,
      name: "Node.js",
    });
    expect(evaluateRequirement("Node.js", "v22.0.0", 24).ok).toBe(false);
    expect(evaluateRequirement("Node.js", "v24.19.0", 24).ok).toBe(true);
  });

  it("uses the Windows command shell only for command shims", () => {
    expect(requiresShell("npm", "win32")).toBe(true);
    expect(requiresShell("npx", "win32")).toBe(true);
    expect(requiresShell("git", "win32")).toBe(false);
    expect(requiresShell("npm", "linux")).toBe(false);
  });

  it("summarizes required failures separately from optional warnings", () => {
    expect(
      summarizeChecks([
        { name: "Node.js", ok: true, required: true, detail: "v24" },
        { name: "Docker", ok: false, required: true, detail: "missing" },
        { name: "Vercel", ok: false, required: false, detail: "not logged in" },
      ]),
    ).toEqual({ failures: 1, warnings: 1 });
  });
});
