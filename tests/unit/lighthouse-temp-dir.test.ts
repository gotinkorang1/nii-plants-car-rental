import { describe, expect, it } from "vitest";

import { getLighthouseTempDir } from "../../scripts/lighthouse-temp-dir.cjs";

describe("Lighthouse temporary directory", () => {
  it("uses a short system path on Linux to avoid Chrome socket limits", () => {
    expect(
      getLighthouseTempDir({
        platform: "linux",
        projectDirectory: "/home/runner/work/a-very-long-repository-name/project",
        systemTempDirectory: "/tmp",
      }),
    ).toBe("/tmp/nii-plants-lhci");
  });

  it("keeps reports under the project on Windows", () => {
    expect(
      getLighthouseTempDir({
        platform: "win32",
        projectDirectory: "C:\\repo",
        systemTempDirectory: "C:\\Temp",
      }),
    ).toBe("C:\\repo\\.lighthouseci\\tmp");
  });
});
