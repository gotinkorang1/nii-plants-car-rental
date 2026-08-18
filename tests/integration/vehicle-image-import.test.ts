import { beforeEach, describe, expect, it, vi } from "vitest";

const downloadImage = vi.fn();
const uploadFleetImageBytes = vi.fn();
const imageImportEnabled = vi.fn(() => true);
const insertedImages: Record<string, unknown>[] = [];
let existingImages: { id: string }[] = [];
let selectFails = false;

vi.mock("@/lib/vehicle-data/provider", () => ({
  CARDATABASE_PROVIDER_NAME: "cardatabase",
  getVehicleDataProvider: () => ({
    name: "cardatabase",
    search: vi.fn(),
    getVehicle: vi.fn(),
    downloadImage,
  }),
  isVehicleDataConfigured: () => true,
  isVehicleImageImportEnabled: () => imageImportEnabled(),
}));

vi.mock("@/lib/fleet/storage", () => ({
  uploadFleetImageBytes: (input: unknown) => uploadFleetImageBytes(input),
}));

vi.mock("@/lib/db", () => ({
  tryGetDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => {
          if (selectFails) {
            throw new Error("connection terminated unexpectedly");
          }
          return existingImages;
        },
      }),
    }),
    insert: () => ({
      values: async (values: Record<string, unknown>) => {
        insertedImages.push(values);
      },
    }),
    update: () => ({
      set: () => ({ where: async () => undefined }),
    }),
  }),
}));

const { importProviderImages } = await import(
  "@/lib/fleet/import-provider-images"
);

const PNG_BYTES = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

function importOne(imageIds = ["aaaa1111bbbb2222"]) {
  return importProviderImages({
    modelId: "33333333-3333-4333-8333-333333333333",
    providerId: "toyota/corolla_2022",
    imageIds,
    primaryImageId: null,
    altTextBase: "Toyota Corolla",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  insertedImages.length = 0;
  existingImages = [];
  selectFails = false;
  imageImportEnabled.mockReturnValue(true);
  downloadImage.mockResolvedValue({
    bytes: PNG_BYTES,
    mimeType: "image/png",
    sourceUrl: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
  });
  uploadFleetImageBytes.mockResolvedValue({
    storagePath: "models/33333333/imported.png",
  });
});

describe("provider image import", () => {
  it("copies the bytes into Nii Plants storage and records provenance", async () => {
    const result = await importOne();

    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect(insertedImages[0]).toMatchObject({
      storagePath: "models/33333333/imported.png",
      sourceProvider: "cardatabase",
      sourceUrl: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
      altText: "Toyota Corolla catalogue image",
      isPrimary: true,
    });
  });

  it("imports nothing when redistribution rights are not confirmed", async () => {
    imageImportEnabled.mockReturnValue(false);

    const result = await importOne();

    expect(result).toEqual({ imported: 0, skipped: 1 });
    expect(downloadImage).not.toHaveBeenCalled();
    expect(uploadFleetImageBytes).not.toHaveBeenCalled();
  });

  it("only asks the provider for images, never a caller-supplied URL", async () => {
    await importOne();

    expect(downloadImage).toHaveBeenCalledWith(
      "toyota/corolla_2022",
      "aaaa1111bbbb2222",
    );
  });

  it("refuses a vehicle reference that is not a provider slug", async () => {
    const result = await importProviderImages({
      modelId: "33333333-3333-4333-8333-333333333333",
      providerId: "https://evil.example.com/payload.png",
      imageIds: ["aaaa1111bbbb2222"],
      primaryImageId: null,
      altTextBase: "Toyota Corolla",
    });

    expect(result).toEqual({ imported: 0, skipped: 1 });
    expect(downloadImage).not.toHaveBeenCalled();
  });

  it("skips bytes that are not a recognised image", async () => {
    downloadImage.mockResolvedValue({
      bytes: new Uint8Array([0x3c, 0x21, 0x44, 0x4f]),
      mimeType: "image/png",
      sourceUrl: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
    });

    const result = await importOne();

    expect(result).toEqual({ imported: 0, skipped: 1 });
    expect(uploadFleetImageBytes).not.toHaveBeenCalled();
    expect(insertedImages).toEqual([]);
  });

  it("keeps importing the rest when one download fails", async () => {
    downloadImage
      .mockRejectedValueOnce(new Error("provider timeout"))
      .mockResolvedValueOnce({
        bytes: PNG_BYTES,
        mimeType: "image/png",
        sourceUrl: "https://cardatabase.dev/api/v1/images/cccc3333dddd4444/file",
      });

    const result = await importOne(["aaaa1111bbbb2222", "cccc3333dddd4444"]);

    expect(result).toEqual({ imported: 1, skipped: 1 });
  });

  it("never throws, so a failed import cannot lose the saved model", async () => {
    selectFails = true;

    await expect(importOne()).resolves.toEqual({ imported: 0, skipped: 1 });
  });

  it("leaves an existing primary image alone", async () => {
    existingImages = [{ id: "existing-image" }];

    await importOne();

    expect(insertedImages[0]).toMatchObject({ isPrimary: false, sortOrder: 1 });
  });
});
