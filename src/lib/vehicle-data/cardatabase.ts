import "server-only";

import { log } from "@/lib/logger";

import { createTtlCache } from "./cache";
import {
  buildSuggestionLabel,
  isElectrified,
  normalizeConnectors,
  normalizeFuelType,
  normalizeTransmission,
  roundTo,
  toFiniteNumber,
  toMillimetres,
  toPositiveInteger,
  toTrimmedString,
  hpToKw,
  kwToHp,
} from "./normalize";
import {
  VehicleDataError,
  type VehicleDataDetail,
  type VehicleDataImage,
  type VehicleDataProvider,
  type VehicleDataSuggestion,
} from "./types";

export const CARDATABASE_PROVIDER_NAME = "cardatabase";
export const CARDATABASE_DEFAULT_BASE_URL = "https://cardatabase.dev/api/v1";

const JSON_TIMEOUT_MS = 8_000;
const IMAGE_TIMEOUT_MS = 15_000;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const SEARCH_LIMIT = 8;

const SEARCH_TTL_MS = 10 * 60 * 1000;
const DETAIL_TTL_MS = 30 * 60 * 1000;

const searchCache = createTtlCache<VehicleDataSuggestion[]>({
  ttlMs: SEARCH_TTL_MS,
  maxEntries: 200,
});
const detailCache = createTtlCache<VehicleDataDetail>({
  ttlMs: DETAIL_TTL_MS,
  maxEntries: 100,
});
// Admin preview and the subsequent import would otherwise fetch the same file
// twice. Deliberately small: these entries hold image bytes.
const imageCache = createTtlCache<{
  bytes: Uint8Array;
  mimeType: string | null;
  sourceUrl: string;
}>({ ttlMs: DETAIL_TTL_MS, maxEntries: 12 });

/** Provider slugs are lowercase; anything else is rejected before we build a URL. */
const SLUG_SEGMENT = /^[a-z0-9][a-z0-9._-]{0,79}$/;
/** Image public ids are 16-char hex, but numeric internal ids are also valid. */
const IMAGE_ID = /^[a-f0-9]{6,64}$|^\d{1,12}$/;

type UnknownRecord = Record<string, unknown>;

export type CarDatabaseConfig = {
  apiKey: string;
  baseUrl: string;
};

export function parseProviderId(
  providerId: string,
): { brandSlug: string; modelSlug: string } | null {
  const parts = providerId.trim().toLowerCase().split("/");
  if (parts.length !== 2) {
    return null;
  }

  const [brandSlug, modelSlug] = parts;
  if (!SLUG_SEGMENT.test(brandSlug) || !SLUG_SEGMENT.test(modelSlug)) {
    return null;
  }

  return { brandSlug, modelSlug };
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function pick(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function pickNumber(record: UnknownRecord, keys: string[]): number | null {
  return toFiniteNumber(pick(record, keys));
}

function pickString(record: UnknownRecord, keys: string[]): string | null {
  return toTrimmedString(pick(record, keys));
}

export function createCarDatabaseProvider(
  config: CarDatabaseConfig,
): VehicleDataProvider {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(baseUrl).origin;
  } catch {
    throw new Error("CARDATABASE_BASE_URL must be an absolute URL.");
  }

  async function request(
    path: string,
    init: { signal?: AbortSignal; accept: "json" | "binary" },
  ): Promise<Response> {
    const url = `${baseUrl}${path}`;
    const timeoutMs = init.accept === "json" ? JSON_TIMEOUT_MS : IMAGE_TIMEOUT_MS;
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeout])
      : timeout;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": config.apiKey,
          Accept: init.accept === "json" ? "application/json" : "image/*",
        },
        signal,
        cache: "no-store",
      });
    } catch (error) {
      if (init.signal?.aborted) {
        throw new VehicleDataError("unavailable", "The lookup was cancelled.");
      }

      log("warn", "vehicle_data_failure", {
        provider: CARDATABASE_PROVIDER_NAME,
        path,
        cause: error instanceof Error ? error.name : "unknown",
      });
      throw new VehicleDataError(
        "unavailable",
        "Vehicle data lookup is temporarily unavailable.",
      );
    }

    if (response.ok) {
      return response;
    }

    const reason =
      response.status === 429
        ? "rate_limited"
        : response.status === 404
          ? "not_found"
          : response.status === 400
            ? "invalid_request"
            : response.status === 401 || response.status === 403
              ? "not_configured"
              : "unavailable";

    if (reason === "rate_limited") {
      log("warn", "vehicle_data_rate_limit", {
        provider: CARDATABASE_PROVIDER_NAME,
        path,
        limit: response.headers.get("X-RateLimit-Limit"),
        remaining: response.headers.get("X-RateLimit-Remaining"),
        reset: response.headers.get("X-RateLimit-Reset"),
      });
    } else if (reason !== "not_found") {
      log("warn", "vehicle_data_failure", {
        provider: CARDATABASE_PROVIDER_NAME,
        path,
        status: response.status,
      });
    }

    throw new VehicleDataError(reason, providerMessage(reason));
  }

  async function requestJson(
    path: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const response = await request(path, { signal, accept: "json" });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new VehicleDataError(
        "unavailable",
        "Vehicle data lookup returned an unreadable response.",
      );
    }

    const envelope = asRecord(body);
    if (envelope.success === false) {
      const error = asRecord(envelope.error);
      const code = toFiniteNumber(error.code);
      throw new VehicleDataError(
        code === 429 ? "rate_limited" : code === 404 ? "not_found" : "unavailable",
        providerMessage(code === 429 ? "rate_limited" : "unavailable"),
      );
    }

    return envelope.data ?? body;
  }

  async function loadDetail(
    providerId: string,
    signal?: AbortSignal,
  ): Promise<VehicleDataDetail> {
    const cached = detailCache.get(providerId);
    if (cached) {
      return cached;
    }

    const parsed = parseProviderId(providerId);
    if (!parsed) {
      throw new VehicleDataError(
        "invalid_request",
        "That vehicle reference is not valid.",
      );
    }

    const modelPath = `/models/${encodeURIComponent(parsed.brandSlug)}/${encodeURIComponent(parsed.modelSlug)}`;

    const detailRaw = await requestJson(modelPath, signal);
    // Keep the optional specs request after the primary response. This avoids
    // occupying two provider connections during an admin import and still
    // treats a specs miss as non-fatal.
    const specsRaw = await requestJson(`${modelPath}/specs`, signal).catch(
      () => null,
    );

    const detail = normalizeDetail(providerId, detailRaw, specsRaw, allowedOrigin);
    detailCache.set(providerId, detail);

    log("info", "vehicle_data_fetch", {
      provider: CARDATABASE_PROVIDER_NAME,
      provider_id: providerId,
      images: detail.images.length,
      is_ev: detail.ev !== null,
    });

    return detail;
  }

  return {
    name: CARDATABASE_PROVIDER_NAME,

    async search(query, signal) {
      const trimmed = query.trim().replace(/\s+/g, " ");
      const cacheKey = trimmed.toLowerCase();
      const cached = searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({
        q: trimmed,
        limit: String(SEARCH_LIMIT),
      });
      const raw = await requestJson(`/models?${params.toString()}`, signal);
      const suggestions = normalizeSuggestions(raw);
      searchCache.set(cacheKey, suggestions);

      log("info", "vehicle_data_search", {
        provider: CARDATABASE_PROVIDER_NAME,
        query_length: trimmed.length,
        results: suggestions.length,
      });

      return suggestions;
    },

    getVehicle: loadDetail,

    async downloadImage(providerId, providerImageId, signal) {
      if (!IMAGE_ID.test(providerImageId)) {
        throw new VehicleDataError(
          "invalid_request",
          "That image reference is not valid.",
        );
      }

      const cacheKey = `${providerId}#${providerImageId}`;
      const cachedImage = imageCache.get(cacheKey);
      if (cachedImage) {
        return cachedImage;
      }

      // Only import images the provider itself listed for this vehicle. The URL
      // is rebuilt from the configured base rather than taken from the client.
      const detail = await loadDetail(providerId, signal);
      const known = detail.images.find(
        (image) => image.providerImageId === providerImageId,
      );
      if (!known) {
        throw new VehicleDataError(
          "invalid_request",
          "That image does not belong to the selected vehicle.",
        );
      }

      const path = `/images/${encodeURIComponent(providerImageId)}/file`;
      const sourceUrl = `${baseUrl}${path}`;
      if (new URL(sourceUrl).origin !== allowedOrigin) {
        throw new VehicleDataError(
          "invalid_request",
          "That image reference is not valid.",
        );
      }

      const response = await request(path, { signal, accept: "binary" });

      const declaredLength = Number(response.headers.get("content-length") ?? "");
      if (Number.isFinite(declaredLength) && declaredLength > IMAGE_MAX_BYTES) {
        throw new VehicleDataError(
          "invalid_request",
          "That image is larger than the 5 MB limit.",
        );
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > IMAGE_MAX_BYTES) {
        throw new VehicleDataError(
          "invalid_request",
          "That image is larger than the 5 MB limit.",
        );
      }

      const downloaded = {
        bytes: new Uint8Array(buffer),
        mimeType: toTrimmedString(response.headers.get("content-type")),
        sourceUrl,
      };
      imageCache.set(cacheKey, downloaded);
      return downloaded;
    },
  };
}

export function providerMessage(
  reason: "not_configured" | "invalid_request" | "not_found" | "rate_limited" | "unavailable",
): string {
  switch (reason) {
    case "not_configured":
      return "Vehicle data lookup is not configured. Enter the vehicle manually.";
    case "invalid_request":
      return "That vehicle lookup request was not valid.";
    case "not_found":
      return "That vehicle was not found in the vehicle database.";
    case "rate_limited":
      return "The vehicle database request limit was reached. Wait a moment or enter the vehicle manually.";
    default:
      return "Vehicle data lookup is temporarily unavailable. You can continue entering the vehicle manually.";
  }
}

export function normalizeSuggestions(raw: unknown): VehicleDataSuggestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const suggestions: VehicleDataSuggestion[] = [];

  for (const entry of raw) {
    const record = asRecord(entry);
    const brandSlug = toTrimmedString(
      pick(record, ["make_slug", "brand_slug"]),
    )?.toLowerCase();
    const modelSlug = toTrimmedString(
      pick(record, ["code", "slug", "model_slug"]),
    )?.toLowerCase();
    const make = pickString(record, ["make_name", "brand_name", "make"]);
    const model = pickString(record, ["model_name", "model", "name"]);

    if (!brandSlug || !modelSlug || !make || !model) {
      continue;
    }

    const providerId = `${brandSlug}/${modelSlug}`;
    if (!parseProviderId(providerId)) {
      continue;
    }

    const year = toPositiveInteger(pick(record, ["year", "model_year"]));
    const trim = pickString(record, ["trim", "trim_name", "variant"]);

    suggestions.push({
      providerId,
      make,
      model,
      year,
      trim,
      bodyType: pickString(record, ["body_type", "body", "body_style"]),
      fuelType: pickString(record, ["fuel_type", "fuel"]),
      label: buildSuggestionLabel({ make, model, year, trim }),
    });
  }

  return suggestions;
}

export function normalizeDetail(
  providerId: string,
  detailRaw: unknown,
  specsRaw: unknown,
  allowedOrigin: string,
): VehicleDataDetail {
  const detail = asRecord(detailRaw);
  const specsEnvelope = asRecord(specsRaw);
  const specs = asRecord(specsEnvelope.specs);

  // Merge so callers can look a field up once regardless of which endpoint
  // returned it. Detail wins because it is the canonical model record.
  const merged: UnknownRecord = { ...specs, ...detail };

  const make =
    pickString(merged, ["make_name", "brand_name", "make"]) ??
    toTrimmedString(providerId.split("/")[0]) ??
    "";
  const model = pickString(merged, ["model_name", "model"]) ?? "";

  const isEvFlag =
    pick(merged, ["is_ev"]) === 1 ||
    pick(merged, ["is_ev"]) === true ||
    specsEnvelope.is_ev === true;

  const fuelLabel = pickString(merged, ["fuel_type", "fuel"]);
  const fuelType = normalizeFuelType(fuelLabel, { isEv: isEvFlag });

  const transmissionLabel = pickString(merged, [
    "transmission",
    "transmission_type",
    "gearbox",
  ]);

  const powerKwRaw = pickNumber(merged, [
    "power_kw",
    "max_power_kw",
    "engine_power_kw",
  ]);
  const powerHpRaw = pickNumber(merged, [
    "horsepower",
    "power_hp",
    "hp",
    "bhp",
    "max_power_hp",
  ]);

  const powerKw =
    powerKwRaw !== null
      ? roundTo(powerKwRaw, 1)
      : powerHpRaw !== null
        ? hpToKw(powerHpRaw)
        : null;
  const powerHp =
    powerHpRaw !== null
      ? Math.round(powerHpRaw)
      : powerKw !== null
        ? kwToHp(powerKw)
        : null;

  const ev = isElectrified(fuelType, isEvFlag)
    ? normalizeEv(asRecord(pick(merged, ["ev"]) ?? asRecord(specsEnvelope.ev)))
    : null;

  return {
    providerId,
    make,
    model,
    year: toPositiveInteger(pick(merged, ["year", "model_year"])),
    generation: pickString(merged, ["generation", "generation_name"]),
    trim: pickString(merged, ["trim", "trim_name", "variant"]),
    bodyType: pickString(merged, ["body_type", "body", "body_style"]),

    engineName: pickString(merged, ["engine", "engine_name", "engine_type"]),
    engineDisplacementL: normalizeDisplacement(merged),
    cylinders: toPositiveInteger(
      pick(merged, ["cylinders", "engine_cylinders", "cylinder_count"]),
    ),
    fuelType,
    fuelLabel,

    powerKw,
    powerHp,
    torqueNm: pickNumber(merged, ["torque_nm", "max_torque_nm", "torque"]),

    transmission: normalizeTransmission(transmissionLabel),
    transmissionLabel,
    driveType: pickString(merged, [
      "drivetrain",
      "drive_type",
      "drive",
      "driven_wheels",
    ]),

    doors: toPositiveInteger(pick(merged, ["doors", "door_count", "number_of_doors"])),
    seats: toPositiveInteger(
      pick(merged, ["seats", "seat_count", "seating_capacity", "number_of_seats"]),
    ),

    dimensions: {
      lengthMm:
        toMillimetres(pick(merged, ["length_mm"]), "length", "mm") ??
        toMillimetres(pick(merged, ["length"]), "length"),
      widthMm:
        toMillimetres(pick(merged, ["width_mm"]), "width", "mm") ??
        toMillimetres(pick(merged, ["width"]), "width"),
      heightMm:
        toMillimetres(pick(merged, ["height_mm"]), "height", "mm") ??
        toMillimetres(pick(merged, ["height"]), "height"),
      wheelbaseMm:
        toMillimetres(pick(merged, ["wheelbase_mm"]), "wheelbase", "mm") ??
        toMillimetres(pick(merged, ["wheelbase"]), "wheelbase"),
    },

    fuelEconomyLPer100Km: pickNumber(merged, [
      "fuel_economy_l_100km",
      "fuel_consumption_l_100km",
      "combined_l_100km",
      "fuel_economy_combined",
      "fuel_consumption",
    ]),

    ev,

    brandLogoUrl: safeProviderUrl(pick(merged, ["logo", "brand_logo"]), allowedOrigin),
    images: normalizeImages(pick(merged, ["images"]), allowedOrigin),
  };
}

function normalizeDisplacement(record: UnknownRecord): number | null {
  const litres = toFiniteNumber(
    pick(record, ["engine_displacement_l", "displacement_l", "engine_litres"]),
  );
  if (litres !== null && litres > 0 && litres < 20) {
    return roundTo(litres, 1);
  }

  const cc = toFiniteNumber(
    pick(record, ["engine_displacement_cc", "displacement_cc", "engine_cc"]),
  );
  if (cc !== null && cc > 100) {
    return roundTo(cc / 1000, 1);
  }

  const ambiguous = toFiniteNumber(
    pick(record, ["engine_displacement", "displacement"]),
  );
  if (ambiguous === null || ambiguous <= 0) {
    return null;
  }

  // Values above 100 are cubic centimetres; small values are already litres.
  return ambiguous > 100 ? roundTo(ambiguous / 1000, 1) : roundTo(ambiguous, 1);
}

function normalizeEv(record: UnknownRecord) {
  const consumptionWhKm = toFiniteNumber(pick(record, ["consumption_wh_km"]));
  const consumptionKwh =
    toFiniteNumber(pick(record, ["consumption_kwh_100km"])) ??
    (consumptionWhKm !== null ? roundTo(consumptionWhKm / 10, 1) : null);

  return {
    batteryKwhGross: pickNumber(record, ["battery_kwh_gross", "battery_gross_kwh"]),
    batteryKwhUsable: pickNumber(record, [
      "battery_kwh_net",
      "battery_kwh_usable",
      "usable_battery_kwh",
    ]),
    rangeKm: pickNumber(record, ["range_wltp_km", "range_km", "range"]),
    acChargingKw: pickNumber(record, [
      "max_ac_kw",
      "ac_charging_kw",
      "onboard_charger_kw",
    ]),
    dcChargingKw: pickNumber(record, ["max_dc_kw", "dc_charging_kw"]),
    consumptionKwhPer100Km: consumptionKwh,
    connectors: normalizeConnectors(pick(record, ["connectors"])),
  };
}

function normalizeImages(raw: unknown, allowedOrigin: string): VehicleDataImage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const images: VehicleDataImage[] = [];

  for (const entry of raw) {
    const record = asRecord(entry);
    const providerImageId = toTrimmedString(
      pick(record, ["public_id", "id"]),
    )?.toLowerCase();
    const url = safeProviderUrl(pick(record, ["url", "file_url"]), allowedOrigin);

    if (!providerImageId || !IMAGE_ID.test(providerImageId) || !url) {
      continue;
    }

    const angles = pick(record, ["angles"]);
    const angle = Array.isArray(angles)
      ? toTrimmedString(asRecord(angles[0]).angle_type)
      : toTrimmedString(pick(record, ["angle", "angle_type"]));

    images.push({
      providerImageId,
      url,
      width: toPositiveInteger(pick(record, ["width"])),
      height: toPositiveInteger(pick(record, ["height"])),
      mimeType: toTrimmedString(pick(record, ["mime_type", "content_type"])),
      angle,
      isPrimary: pick(record, ["is_primary"]) === 1 || record.is_primary === true,
    });
  }

  return images;
}

/** Rejects any URL that is not https on the configured provider origin. */
function safeProviderUrl(value: unknown, allowedOrigin: string): string | null {
  const raw = toTrimmedString(value);
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") {
      return null;
    }

    const origin = new URL(allowedOrigin);
    return url.hostname.toLowerCase() === origin.hostname.toLowerCase()
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
