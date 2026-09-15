/**
 * Upserts pickup locations, vehicle classes, and published models from
 * seed-catalog.json. Never inserts physical vehicles, promotions, or extras.
 */
export async function upsertLocationsClassesAndModels(sql, catalog) {
  for (const location of catalog.locations) {
    await sql`
      INSERT INTO locations (name, slug, type, address, latitude, longitude, active)
      VALUES (
        ${location.name},
        ${location.slug},
        ${location.type},
        ${location.address ?? null},
        ${location.latitude ?? null},
        ${location.longitude ?? null},
        ${location.active}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        address = excluded.address,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        active = excluded.active
    `;
  }

  for (const vehicleClass of catalog.vehicleClasses) {
    await sql`
      INSERT INTO vehicle_classes (
        name,
        slug,
        description,
        seats,
        luggage,
        transmission,
        default_daily_rate,
        default_security_deposit,
        usd_daily_rate_from,
        usd_daily_rate_to,
        active
      )
      VALUES (
        ${vehicleClass.name},
        ${vehicleClass.slug},
        ${vehicleClass.description},
        ${vehicleClass.seats},
        ${vehicleClass.luggage},
        ${vehicleClass.transmission},
        ${vehicleClass.defaultDailyRate},
        ${vehicleClass.defaultSecurityDeposit},
        ${vehicleClass.usdDailyRateFrom ?? null},
        ${vehicleClass.usdDailyRateTo ?? null},
        ${vehicleClass.active}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        seats = excluded.seats,
        luggage = excluded.luggage,
        transmission = excluded.transmission,
        default_daily_rate = excluded.default_daily_rate,
        default_security_deposit = excluded.default_security_deposit,
        usd_daily_rate_from = excluded.usd_daily_rate_from,
        usd_daily_rate_to = excluded.usd_daily_rate_to,
        active = excluded.active
    `;
  }

  for (const model of catalog.vehicleModels) {
    await sql`
      INSERT INTO vehicle_models (
        vehicle_class_id,
        make,
        model,
        slug,
        year_from,
        year_to,
        description,
        seats,
        doors,
        transmission,
        fuel_type,
        luggage,
        air_conditioning,
        featured,
        published,
        usd_daily_rate_from,
        usd_daily_rate_to
      )
      SELECT
        vehicle_classes.id,
        ${model.make},
        ${model.model},
        ${model.slug},
        ${model.yearFrom ?? null},
        ${model.yearTo ?? null},
        ${model.description},
        ${model.seats},
        ${model.doors},
        ${model.transmission},
        ${model.fuelType},
        ${model.luggage},
        ${model.airConditioning},
        ${model.featured},
        ${model.published},
        ${model.usdDailyRateFrom ?? null},
        ${model.usdDailyRateTo ?? null}
      FROM vehicle_classes
      WHERE vehicle_classes.slug = ${model.classSlug}
      ON CONFLICT (slug) DO UPDATE SET
        make = excluded.make,
        model = excluded.model,
        year_from = excluded.year_from,
        year_to = excluded.year_to,
        description = excluded.description,
        seats = excluded.seats,
        doors = excluded.doors,
        transmission = excluded.transmission,
        fuel_type = excluded.fuel_type,
        luggage = excluded.luggage,
        air_conditioning = excluded.air_conditioning,
        featured = excluded.featured,
        published = excluded.published,
        usd_daily_rate_from = excluded.usd_daily_rate_from,
        usd_daily_rate_to = excluded.usd_daily_rate_to
    `;
  }
}
