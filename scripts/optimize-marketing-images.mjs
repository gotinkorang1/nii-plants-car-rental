import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "public", "img");
const outDir = path.join(root, "public", "images");

/** @type {{ source: string, dest: string, maxWidth?: number, width?: number, height?: number, fit?: keyof sharp.FitEnum }[]} */
const jobs = [
  {
    source: "smiley-woman-holding-up-her-car-keys.jpg",
    dest: "keys.webp",
    maxWidth: 1600,
  },
  {
    source: "h3-img-8-2048x734.jpg",
    dest: "executive-banner.webp",
    maxWidth: 2048,
  },
  {
    source: "h3-img-8-2048x734.jpg",
    dest: "og-default.jpg",
    width: 1200,
    height: 630,
    fit: "cover",
  },
  {
    source:
      "rich-business-african-woman-sit-driver-seat-silver-suv-car-with-opened-door.jpg",
    dest: "self-drive.webp",
    maxWidth: 1600,
  },
  {
    source: "taxi-driver-waiting-her-client.jpg",
    dest: "chauffeur.webp",
    maxWidth: 1600,
  },
  {
    source: "businesswoman-getting-taxi-cab.jpg",
    dest: "chauffeur-welcome.webp",
    maxWidth: 1600,
  },
  {
    source: "smiley-woman-placing-her-luggage-her-trunk.jpg",
    dest: "airport.webp",
    maxWidth: 1600,
  },
  {
    source:
      "african-muslim-woman-sitting-her-car-holding-digital-tablet-working-remotely-sharing-info.jpg",
    dest: "long-term.webp",
    maxWidth: 1600,
  },
  {
    source: "group-african-american-girls-friends-having-fun-car.jpg",
    dest: "events.webp",
    maxWidth: 1600,
  },
  {
    source: "two-african-american-girls-friends-having-fun-car.jpg",
    dest: "friends.webp",
    maxWidth: 1600,
  },
  {
    source: "african-american-business-man-car.jpg",
    dest: "corporate.webp",
    maxWidth: 1600,
  },
  {
    source: "person-office-work-day.jpg",
    dest: "office.webp",
    maxWidth: 1600,
  },
  {
    source:
      "rich-business-african-woman-sunglasses-sit-suv-car-with-black-leather-seats.jpg",
    dest: "executive-suv.webp",
    maxWidth: 1600,
  },
  {
    source: "high-angle-valet-holding-key.jpg",
    dest: "valet.webp",
    maxWidth: 1600,
  },
  {
    source: "medium-shot-man-getting-out-car.jpg",
    dest: "arrival.webp",
    maxWidth: 1600,
  },
  {
    source: "front-view-handsome-african-elegant-serious-business-man-drives-car.jpg",
    dest: "driving.webp",
    maxWidth: 1600,
  },
  {
    source: "handsome-elegant-man-car-salon.jpg",
    dest: "cabin.webp",
    maxWidth: 1600,
  },
  {
    source:
      "bipoc-specialist-car-service-using-professional-mechanical-tool-repair-broken-ignition-system-licensed-specialist-garage-fixing-client-automobile-ensuring-optimal-automotive-performance.jpg",
    dest: "workshop.webp",
    maxWidth: 1600,
  },
  {
    source: "medium-shot-woman-posing-car.jpg",
    dest: "portrait.webp",
    maxWidth: 1600,
  },
  {
    source: "smiley-woman-posing-car-while-talking-smartphone.jpg",
    dest: "phone.webp",
    maxWidth: 1600,
  },
];

async function processJob(job) {
  const input = path.join(sourceDir, job.source);
  const output = path.join(outDir, job.dest);
  let pipeline = sharp(input, { failOn: "none", sequentialRead: true }).rotate();

  if (job.width && job.height) {
    pipeline = pipeline.resize(job.width, job.height, {
      fit: job.fit ?? "cover",
      position: "attention",
    });
  } else {
    pipeline = pipeline.resize({
      width: job.maxWidth ?? 1600,
      withoutEnlargement: true,
    });
  }

  if (job.dest.endsWith(".jpg")) {
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  } else {
    pipeline = pipeline.webp({ quality: 78, effort: 4 });
  }

  const info = await pipeline.toFile(output);
  const bytes = (await stat(output)).size;
  console.log(
    `${job.dest}\t${info.width}x${info.height}\t${Math.round(bytes / 1024)}KB`,
  );
  return { dest: job.dest, width: info.width, height: info.height };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const results = [];
  for (const job of jobs) {
    results.push(await processJob(job));
  }

  const leftovers = await readdir(sourceDir);
  for (const file of leftovers) {
    await rm(path.join(sourceDir, file), { force: true });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
