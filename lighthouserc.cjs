const fs = require("node:fs");
const os = require("node:os");

const { getLighthouseTempDir } = require("./scripts/lighthouse-temp-dir.cjs");

const lighthouseTmp = getLighthouseTempDir({
  platform: process.platform,
  projectDirectory: __dirname,
  systemTempDirectory: os.tmpdir(),
});
fs.mkdirSync(lighthouseTmp, { recursive: true });
process.env.TEMP = lighthouseTmp;
process.env.TMP = lighthouseTmp;
process.env.TMPDIR = lighthouseTmp;

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/fleet",
        "http://127.0.0.1:3000/fleet/kia-pegas",
        "http://127.0.0.1:3000/book",
        "http://127.0.0.1:3000/services/chauffeur",
      ],
      startServerCommand: "npm run start -- --hostname 127.0.0.1 --port 3000",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless=new --disable-gpu --no-sandbox",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.95 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
      reportFilenamePattern:
        "%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%",
    },
  },
};
