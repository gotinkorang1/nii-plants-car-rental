import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const html = path.resolve(__dirname, "render-logo.html");
  const outDir = path.resolve(__dirname, "../public/brand");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 2000, height: 2100 },
    deviceScaleFactor: 2,
  });
  await page.goto(`file://${html.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const dest = path.join(outDir, "nii-plants-logo.png");
  await page.locator("#stage").screenshot({
    path: dest,
    omitBackground: true,
  });
  await browser.close();
  console.log("wrote", dest);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
