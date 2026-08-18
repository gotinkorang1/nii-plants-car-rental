import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffRole } from "@/lib/auth/roles";
import { VehicleDataError } from "@/lib/vehicle-data/types";

const getStaffUser = vi.fn();
const search = vi.fn();
const getVehicle = vi.fn();
const downloadImage = vi.fn();
const imageImportEnabled = vi.fn(() => false);

vi.mock("@/lib/auth/get-staff-user", () => ({
  getStaffUser: () => getStaffUser(),
}));

vi.mock("@/lib/vehicle-data/provider", () => ({
  CARDATABASE_PROVIDER_NAME: "cardatabase",
  getVehicleDataProvider: () => ({
    name: "cardatabase",
    search,
    getVehicle,
    downloadImage,
  }),
  isVehicleDataConfigured: () => true,
  isVehicleImageImportEnabled: () => imageImportEnabled(),
}));

vi.mock("@/lib/fleet/find-similar-models", () => ({
  findSimilarVehicleModels: vi.fn(async () => [
    {
      id: "22222222-2222-4222-8222-222222222222",
      slug: "toyota-corolla",
      make: "Toyota",
      model: "Corolla",
      yearFrom: 2021,
      trimLevel: "L",
      published: true,
    },
  ]),
}));

const { GET: searchRoute } = await import(
  "@/app/api/admin/vehicle-data/search/route"
);
const { GET: vehicleRoute } = await import(
  "@/app/api/admin/vehicle-data/vehicle/[...providerId]/route"
);
const { GET: imageRoute } = await import(
  "@/app/api/admin/vehicle-data/image/route"
);

let staffCounter = 0;

function signInAs(role: StaffRole) {
  staffCounter += 1;
  getStaffUser.mockResolvedValue({
    // A fresh id per test keeps the per-user rate limiter out of the way.
    id: `staff-${role}-${staffCounter}`,
    authUserId: `auth-${staffCounter}`,
    displayName: "Test Staff",
    email: "staff@example.test",
    role,
  });
}

function request(url: string) {
  return new NextRequest(`http://127.0.0.1:3000${url}`);
}

function vehicleParams(providerId: string) {
  return { params: Promise.resolve({ providerId: providerId.split("/") }) };
}

const COROLLA = {
  providerId: "toyota/corolla_2022",
  make: "Toyota",
  model: "Corolla",
  year: 2022,
  generation: "E210",
  trim: "LE",
  bodyType: "sedan",
  engineName: "1.8 L 4-cylinder",
  engineDisplacementL: 1.8,
  cylinders: 4,
  fuelType: "petrol" as const,
  fuelLabel: "petrol",
  powerKw: 103,
  powerHp: 140,
  torqueNm: 177,
  transmission: "automatic" as const,
  transmissionLabel: "CVT automatic",
  driveType: "FWD",
  doors: 4,
  seats: 5,
  dimensions: {
    lengthMm: 4630,
    widthMm: 1780,
    heightMm: 1435,
    wheelbaseMm: 2700,
  },
  fuelEconomyLPer100Km: 6.1,
  ev: null,
  brandLogoUrl: null,
  images: [
    {
      providerImageId: "aaaa1111bbbb2222",
      url: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
      width: 1920,
      height: 1080,
      mimeType: "image/png",
      angle: "front",
      isPrimary: true,
    },
  ],
};

const PNG_BYTES = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

beforeEach(() => {
  vi.clearAllMocks();
  imageImportEnabled.mockReturnValue(false);
  search.mockResolvedValue([
    {
      providerId: "toyota/corolla_2022",
      make: "Toyota",
      model: "Corolla",
      year: 2022,
      trim: "LE",
      bodyType: "sedan",
      fuelType: "petrol",
      label: "2022 Toyota Corolla LE",
    },
  ]);
  getVehicle.mockResolvedValue(COROLLA);
  downloadImage.mockResolvedValue({
    bytes: PNG_BYTES,
    mimeType: "image/png",
    sourceUrl: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
  });
});

describe("vehicle data endpoint authorization", () => {
  it("refuses anonymous visitors", async () => {
    getStaffUser.mockResolvedValue(null);

    const response = await searchRoute(
      request("/api/admin/vehicle-data/search?q=corolla"),
    );

    expect(response.status).toBe(401);
    expect(search).not.toHaveBeenCalled();
  });

  it("refuses staff without fleet management rights", async () => {
    signInAs("content_editor");

    const response = await searchRoute(
      request("/api/admin/vehicle-data/search?q=corolla"),
    );

    expect(response.status).toBe(403);
    expect(search).not.toHaveBeenCalled();
  });

  it.each(["fleet", "administrator"] as const)(
    "allows the %s role to search",
    async (role) => {
      signInAs(role);

      const response = await searchRoute(
        request("/api/admin/vehicle-data/search?q=toyota%20corolla"),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        results: [expect.objectContaining({ providerId: "toyota/corolla_2022" })],
      });
      expect(search).toHaveBeenCalledWith("toyota corolla", expect.anything());
    },
  );

  it("refuses anonymous visitors on the detail and image endpoints", async () => {
    getStaffUser.mockResolvedValue(null);

    const detail = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/toyota/corolla_2022"),
      vehicleParams("toyota/corolla_2022"),
    );
    const image = await imageRoute(
      request(
        "/api/admin/vehicle-data/image?vehicle=toyota/corolla_2022&image=aaaa1111bbbb2222",
      ),
    );

    expect(detail.status).toBe(401);
    expect(image.status).toBe(401);
    expect(getVehicle).not.toHaveBeenCalled();
    expect(downloadImage).not.toHaveBeenCalled();
  });
});

describe("vehicle data search endpoint", () => {
  it("rejects queries that are too short or contain unexpected characters", async () => {
    signInAs("fleet");

    const short = await searchRoute(request("/api/admin/vehicle-data/search?q=t"));
    expect(short.status).toBe(400);

    signInAs("fleet");
    const unsafe = await searchRoute(
      request("/api/admin/vehicle-data/search?q=%3Cscript%3E"),
    );
    expect(unsafe.status).toBe(400);
    expect(search).not.toHaveBeenCalled();
  });

  it("maps a provider rate limit onto 429 without leaking internals", async () => {
    signInAs("fleet");
    search.mockRejectedValue(
      new VehicleDataError("rate_limited", "The vehicle database request limit was reached."),
    );

    const response = await searchRoute(
      request("/api/admin/vehicle-data/search?q=corolla"),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      reason: "rate_limited",
    });
  });

  it("maps a provider outage onto 502 with a recoverable message", async () => {
    signInAs("fleet");
    search.mockRejectedValue(new Error("socket hang up"));

    const response = await searchRoute(
      request("/api/admin/vehicle-data/search?q=corolla"),
    );

    expect(response.status).toBe(502);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/manually/i);
    expect(body.error).not.toMatch(/socket hang up/);
  });
});

describe("vehicle data detail endpoint", () => {
  it("returns normalized fields, images and a duplicate warning", async () => {
    signInAs("fleet");

    const response = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/toyota/corolla_2022"),
      vehicleParams("toyota/corolla_2022"),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.providerId).toBe("toyota/corolla_2022");
    expect(payload.label).toBe("2022 Toyota Corolla LE");
    expect(payload.fields).toMatchObject({
      make: "Toyota",
      model: "Corolla",
      yearFrom: 2022,
      yearTo: 2022,
      trimLevel: "LE",
      powerKw: 103,
      transmission: "automatic",
      lengthMm: 4630,
    });
    // Business fields are never part of the import payload.
    expect(payload.fields).not.toHaveProperty("vehicleClassId");
    expect(payload.fields).not.toHaveProperty("description");
    expect(payload.fields).not.toHaveProperty("luggage");
    expect(payload.fields).not.toHaveProperty("published");

    expect(payload.images).toEqual([
      {
        providerImageId: "aaaa1111bbbb2222",
        previewUrl:
          "/api/admin/vehicle-data/image?vehicle=toyota%2Fcorolla_2022&image=aaaa1111bbbb2222",
        width: 1920,
        height: 1080,
        angle: "front",
        isPrimary: true,
      },
    ]);
    expect(payload.duplicates).toHaveLength(1);
  });

  it("never hands the browser a provider URL", async () => {
    signInAs("fleet");

    const response = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/toyota/corolla_2022"),
      vehicleParams("toyota/corolla_2022"),
    );

    expect(JSON.stringify(await response.json())).not.toContain(
      "cardatabase.dev",
    );
  });

  it("rejects a malformed provider reference before calling the provider", async () => {
    signInAs("fleet");

    const response = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/..%2F..%2Fetc"),
      vehicleParams("../../etc"),
    );

    expect(response.status).toBe(400);
    expect(getVehicle).not.toHaveBeenCalled();
  });

  it("reports whether image import is permitted", async () => {
    signInAs("fleet");
    const off = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/toyota/corolla_2022"),
      vehicleParams("toyota/corolla_2022"),
    );
    expect((await off.json()).imageImportEnabled).toBe(false);

    signInAs("fleet");
    imageImportEnabled.mockReturnValue(true);
    const on = await vehicleRoute(
      request("/api/admin/vehicle-data/vehicle/toyota/corolla_2022"),
      vehicleParams("toyota/corolla_2022"),
    );
    expect((await on.json()).imageImportEnabled).toBe(true);
  });
});

describe("vehicle data image proxy", () => {
  it("streams provider bytes with a detected content type", async () => {
    signInAs("fleet");

    const response = await imageRoute(
      request(
        "/api/admin/vehicle-data/image?vehicle=toyota%2Fcorolla_2022&image=aaaa1111bbbb2222",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, max-age=600");
    expect(downloadImage).toHaveBeenCalledWith(
      "toyota/corolla_2022",
      "aaaa1111bbbb2222",
      expect.anything(),
    );
  });

  it("refuses bytes that are not a recognised image", async () => {
    signInAs("fleet");
    downloadImage.mockResolvedValue({
      bytes: new Uint8Array([0x3c, 0x73, 0x76, 0x67]),
      mimeType: "image/svg+xml",
      sourceUrl: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
    });

    const response = await imageRoute(
      request(
        "/api/admin/vehicle-data/image?vehicle=toyota%2Fcorolla_2022&image=aaaa1111bbbb2222",
      ),
    );

    expect(response.status).toBe(415);
  });

  it("rejects a malformed vehicle reference", async () => {
    signInAs("fleet");

    const response = await imageRoute(
      request("/api/admin/vehicle-data/image?vehicle=evil.example.com&image=1"),
    );

    expect(response.status).toBe(400);
    expect(downloadImage).not.toHaveBeenCalled();
  });
});

describe("provider key exposure", () => {
  function sourceFiles(directory: string): string[] {
    const entries = readdirSync(directory);
    const files: string[] = [];

    for (const entry of entries) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        files.push(...sourceFiles(path));
      } else if (/\.(ts|tsx)$/.test(entry)) {
        files.push(path);
      }
    }

    return files;
  }

  it("never exposes the provider key through a NEXT_PUBLIC variable", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) =>
      /NEXT_PUBLIC_CARDATABASE|NEXT_PUBLIC_CAR_DATABASE/.test(
        readFileSync(file, "utf8"),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the API key out of client components", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((file) => {
      const source = readFileSync(file, "utf8");
      return (
        source.includes('"use client"') &&
        source.includes("CARDATABASE_API_KEY")
      );
    });

    expect(offenders).toEqual([]);
  });

  it("guards the adapter behind server-only", () => {
    for (const file of ["cardatabase.ts", "provider.ts", "route-helpers.ts"]) {
      const source = readFileSync(
        join(process.cwd(), "src", "lib", "vehicle-data", file),
        "utf8",
      );
      expect(source).toContain('import "server-only"');
    }
  });
});
