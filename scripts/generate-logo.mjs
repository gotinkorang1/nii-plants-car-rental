import { chromium } from "playwright";
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(tmpdir(), "nii-logo-fonts");
const outDir = path.join(root, "public/brand");
const htmlPath = path.join(tmpdir(), "nii-plants-render-logo.html");

function dataUri(bytes) {
  return `data:font/woff2;base64,${Buffer.from(bytes).toString("base64")}`;
}

async function ensureFont(filename, url) {
  const dest = path.join(fontDir, filename);
  try {
    return await readFile(dest);
  } catch {
    await mkdir(fontDir, { recursive: true });
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!response.ok) {
      throw new Error(`Could not download ${filename}: ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(dest, bytes);
    return bytes;
  }
}

const mark = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 980" role="img" aria-label="Nii Plants Car Rental">
  <defs>
    <path
      id="shield"
      d="M500 26
         C558 28 688 76 800 146
         C892 206 952 258 952 348
         C952 450 938 582 916 702
         C888 832 708 920 500 936
         C292 920 112 832 84 702
         C62 582 48 450 48 348
         C48 258 108 206 200 146
         C312 76 442 28 500 26Z"
    />
    <clipPath id="face">
      <use href="#shield" />
    </clipPath>
  </defs>

  <use href="#shield" fill="#111111" />
  <g clip-path="url(#face)">
    <rect width="1000" height="980" fill="#ffffff" />
    <rect x="0" y="486" width="1000" height="500" fill="#211f20" />

    <g
      fill="#111111"
      stroke="#111111"
      stroke-linecap="round"
      stroke-linejoin="round"
      transform="translate(500 298)"
    >
      <path
        d="M-248 24
           C-198 4 -142 -22 -96 -46
           C-48 -70 -4 -80 52 -80
           C118 -80 176 -58 230 -16
           L262 -30 L280 -8 L246 8
           C198 -26 146 -54 52 -56
           C0 -56 -42 -46 -84 -24
           C-128 0 -186 16 -244 36
           C-250 32 -252 28 -248 24Z"
      />
      <path
        d="M-176 32
           C-108 10 -28 -10 78 -26
           C70 -14 60 -10 46 -6
           C-48 10 -118 30 -170 46
           C-178 40 -180 36 -176 32Z"
      />
      <path
        d="M-154 54
           C-82 36 8 16 112 2
           C104 14 94 18 80 22
           C-16 36 -88 54 -148 66
           C-156 60 -158 56 -154 54Z"
      />
      <path
        d="M-228 66
           C-128 80 -16 82 132 68
           C198 62 236 58 250 60
           C252 70 248 78 236 80
           C198 88 132 94 -16 94
           C-128 92 -210 82 -232 74
           C-236 72 -234 68 -228 66Z"
      />
      <path stroke-width="10" fill="none" d="M-262 18 L-262 58" />
      <path stroke-width="8" fill="none" d="M204 8 L226 30" />
      <path stroke-width="7" fill="none" d="M220 -2 L244 24" />
      <circle cx="-148" cy="98" r="31" fill="#ffffff" stroke-width="12" />
      <circle cx="-148" cy="98" r="7" />
      <circle cx="154" cy="98" r="33" fill="#ffffff" stroke-width="12" />
      <circle cx="154" cy="98" r="7.5" />
    </g>
  </g>

  <use href="#shield" fill="none" stroke="#111111" stroke-width="12" />

  <text class="brand" x="500" y="642" text-anchor="middle">NII PLANTS</text>
  <rect x="318" y="670" width="364" height="4" rx="2" fill="#d8d8d8" />
  <text class="tag" x="500" y="758" text-anchor="middle">Car Rental</text>
</svg>
`.trim();

const [oswald, script] = await Promise.all([
  ensureFont(
    "oswald-latin.woff2",
    "https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1xZosUZiZQ.woff2",
  ),
  ensureFont(
    "greatvibes-latin.woff2",
    "https://fonts.gstatic.com/s/greatvibes/v21/RWmMoKWR9v4ksMfaWd_JN9XFiaQ.woff2",
  ),
]);

const fontCss = `
@font-face {
  font-family: "Oswald";
  font-style: normal;
  font-weight: 700;
  src: url("${dataUri(oswald)}") format("woff2");
}
@font-face {
  font-family: "Great Vibes";
  font-style: normal;
  font-weight: 400;
  src: url("${dataUri(script)}") format("woff2");
}
.brand {
  font-family: Oswald, "Arial Narrow", sans-serif;
  font-weight: 700;
  font-size: 92px;
  letter-spacing: 0.045em;
  fill: #f07a28;
}
.tag {
  font-family: "Great Vibes", cursive;
  font-size: 78px;
  fill: #f4f4f4;
  stroke: #111111;
  stroke-width: 1.6;
  paint-order: stroke fill;
}
`;

const svg = mark.replace(
  "<defs>",
  `<defs>\n    <style>${fontCss}</style>`,
);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Nii Plants logo</title>
    <style>
      html, body { margin: 0; background: transparent; }
      #stage {
        width: 2000px;
        height: 2100px;
        display: grid;
        place-items: center;
      }
      svg { width: 1800px; height: auto; }
      ${fontCss}
    </style>
  </head>
  <body>
    <div id="stage">${mark}</div>
  </body>
</html>
`;

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "nii-plants-logo.svg"), `${svg}\n`);
await writeFile(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 2000, height: 2100 },
  deviceScaleFactor: 2,
});
await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
await page.evaluate(async () => {
  if (document.fonts?.ready) await document.fonts.ready;
});
await new Promise((resolve) => setTimeout(resolve, 300));
const pngPath = path.join(outDir, "nii-plants-logo.png");
await page.locator("#stage").screenshot({
  path: pngPath,
  omitBackground: true,
});
await browser.close();
console.log("wrote", path.join(outDir, "nii-plants-logo.svg"));
console.log("wrote", pngPath);
