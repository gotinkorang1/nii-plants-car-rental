import "server-only";

import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  locations,
  vehicleClasses,
  vehicleImages,
  vehicleModels,
  vehicles,
} from "@/lib/db/schema";
import { vehicleStatusSchema } from "@/lib/validation/vehicle-class";

export async function listVehicleClasses(search?: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select({
      class: vehicleClasses,
    })
    .from(vehicleClasses)
    .where(
      search
        ? or(
            ilike(vehicleClasses.name, `%${search}%`),
            ilike(vehicleClasses.slug, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(vehicleClasses.name);

  const classIds = rows.map((row) => row.class.id);
  const modelCounts =
    classIds.length === 0
      ? []
      : await db
          .select({
            vehicleClassId: vehicleModels.vehicleClassId,
            count: vehicleModels.id,
          })
          .from(vehicleModels)
          .where(inArray(vehicleModels.vehicleClassId, classIds));

  const countMap = new Map<string, number>();
  for (const row of modelCounts) {
    countMap.set(
      row.vehicleClassId,
      (countMap.get(row.vehicleClassId) ?? 0) + 1,
    );
  }

  return rows.map((row) => ({
    ...row.class,
    modelCount: countMap.get(row.class.id) ?? 0,
  }));
}

export async function getVehicleClass(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select()
    .from(vehicleClasses)
    .where(eq(vehicleClasses.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const publishedModels = await db
    .select({ id: vehicleModels.id })
    .from(vehicleModels)
    .where(
      and(
        eq(vehicleModels.vehicleClassId, id),
        eq(vehicleModels.published, true),
      ),
    )
    .limit(1);

  return {
    ...row,
    slugLocked: publishedModels.length > 0,
  };
}

export async function listVehicleModels(input: {
  search?: string;
  classId?: string;
  published?: "all" | "published" | "unpublished";
}) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const filters = [
    input.classId ? eq(vehicleModels.vehicleClassId, input.classId) : undefined,
    input.published === "published"
      ? eq(vehicleModels.published, true)
      : input.published === "unpublished"
        ? eq(vehicleModels.published, false)
        : undefined,
    input.search
      ? or(
          ilike(vehicleModels.make, `%${input.search}%`),
          ilike(vehicleModels.model, `%${input.search}%`),
          ilike(vehicleModels.slug, `%${input.search}%`),
        )
      : undefined,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  const rows = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(vehicleModels.make, vehicleModels.model);

  const modelIds = rows.map((row) => row.model.id);
  const unitRows =
    modelIds.length === 0
      ? []
      : await db
          .select({
            vehicleModelId: vehicles.vehicleModelId,
            id: vehicles.id,
          })
          .from(vehicles)
          .where(inArray(vehicles.vehicleModelId, modelIds));
  const imageRows =
    modelIds.length === 0
      ? []
      : await db
          .select()
          .from(vehicleImages)
          .where(inArray(vehicleImages.vehicleModelId, modelIds));

  const unitCount = new Map<string, number>();
  for (const row of unitRows) {
    unitCount.set(row.vehicleModelId, (unitCount.get(row.vehicleModelId) ?? 0) + 1);
  }

  const primaryByModel = new Map<string, (typeof vehicleImages.$inferSelect)>();
  for (const image of imageRows) {
    const current = primaryByModel.get(image.vehicleModelId);
    if (!current || (image.isPrimary && !current.isPrimary)) {
      primaryByModel.set(image.vehicleModelId, image);
    }
  }

  return rows.map((row) => ({
    ...row.model,
    className: row.vehicleClass.name,
    unitCount: unitCount.get(row.model.id) ?? 0,
    primaryImage: primaryByModel.get(row.model.id) ?? null,
  }));
}

export async function getVehicleModel(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(eq(vehicleModels.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleModelId, id))
    .orderBy(vehicleImages.sortOrder, desc(vehicleImages.isPrimary));

  return {
    ...row.model,
    className: row.vehicleClass.name,
    images,
  };
}

export async function listPhysicalVehicles(input: {
  search?: string;
  status?: string;
  classId?: string;
}) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const status = vehicleStatusSchema.safeParse(input.status);

  const filters = [
    input.classId ? eq(vehicles.vehicleClassId, input.classId) : undefined,
    status.success ? eq(vehicles.status, status.data) : undefined,
    input.search
      ? or(
          ilike(vehicles.internalCode, `%${input.search}%`),
          ilike(vehicles.registrationNumber, `%${input.search}%`),
          ilike(vehicles.colour, `%${input.search}%`),
        )
      : undefined,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  const rows = await db
    .select({
      vehicle: vehicles,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      location: locations,
    })
    .from(vehicles)
    .innerJoin(vehicleModels, eq(vehicles.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(vehicles.vehicleClassId, vehicleClasses.id))
    .innerJoin(locations, eq(vehicles.branchLocationId, locations.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(vehicles.internalCode);

  return rows.map((row) => ({
    ...row.vehicle,
    make: row.model.make,
    modelName: row.model.model,
    className: row.vehicleClass.name,
    branchName: row.location.name,
  }));
}

export async function getPhysicalVehicle(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);

  return row ?? null;
}

export async function listClassOptions() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: vehicleClasses.id,
      name: vehicleClasses.name,
      active: vehicleClasses.active,
    })
    .from(vehicleClasses)
    .orderBy(vehicleClasses.name);
}

export async function listModelOptions() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: vehicleModels.id,
      make: vehicleModels.make,
      model: vehicleModels.model,
      vehicleClassId: vehicleModels.vehicleClassId,
      className: vehicleClasses.name,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .orderBy(vehicleModels.make, vehicleModels.model);
}

export async function listBranchOptions() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: locations.id,
      name: locations.name,
    })
    .from(locations)
    .where(eq(locations.active, true))
    .orderBy(locations.name);
}
