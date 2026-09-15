-- Phase 12: published shop USD catalogue rates and OpenStreetMap coordinates.
--
-- Paystack and booking totals stay GHS pesewas. USD columns are the live
-- shop prices for public display. Location pins are OSM/Nominatim, not Google.

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
--> statement-breakpoint

ALTER TABLE public.locations
  DROP CONSTRAINT IF EXISTS locations_coordinates_complete;
--> statement-breakpoint
ALTER TABLE public.locations
  ADD CONSTRAINT locations_coordinates_complete
  CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (
      latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    )
  );
--> statement-breakpoint

ALTER TABLE public.vehicle_classes
  ADD COLUMN IF NOT EXISTS usd_daily_rate_from integer,
  ADD COLUMN IF NOT EXISTS usd_daily_rate_to integer;
--> statement-breakpoint

ALTER TABLE public.vehicle_classes
  DROP CONSTRAINT IF EXISTS vehicle_classes_usd_daily_rate_range;
--> statement-breakpoint
ALTER TABLE public.vehicle_classes
  ADD CONSTRAINT vehicle_classes_usd_daily_rate_range
  CHECK (
    (usd_daily_rate_from IS NULL AND usd_daily_rate_to IS NULL)
    OR (
      usd_daily_rate_from IS NOT NULL
      AND usd_daily_rate_to IS NOT NULL
      AND usd_daily_rate_from > 0
      AND usd_daily_rate_to >= usd_daily_rate_from
    )
  );
--> statement-breakpoint

ALTER TABLE public.vehicle_models
  ADD COLUMN IF NOT EXISTS usd_daily_rate_from integer,
  ADD COLUMN IF NOT EXISTS usd_daily_rate_to integer;
--> statement-breakpoint

ALTER TABLE public.vehicle_models
  DROP CONSTRAINT IF EXISTS vehicle_models_usd_daily_rate_range;
--> statement-breakpoint
ALTER TABLE public.vehicle_models
  ADD CONSTRAINT vehicle_models_usd_daily_rate_range
  CHECK (
    (usd_daily_rate_from IS NULL AND usd_daily_rate_to IS NULL)
    OR (
      usd_daily_rate_from IS NOT NULL
      AND usd_daily_rate_to IS NOT NULL
      AND usd_daily_rate_from > 0
      AND usd_daily_rate_to >= usd_daily_rate_from
    )
  );
--> statement-breakpoint

CREATE OR REPLACE VIEW public.public_vehicle_catalogue AS
SELECT
  vm.id,
  vm.slug,
  vm.make,
  vm.model,
  vm.description,
  vm.seats,
  vm.doors,
  vm.transmission,
  vm.fuel_type,
  vm.luggage,
  vm.air_conditioning,
  vm.featured,
  vm.year_from,
  vm.year_to,
  vc.name AS class_name,
  vc.slug AS class_slug,
  vc.default_daily_rate AS daily_rate_pesewas,
  vm.generation,
  vm.trim_level,
  vm.body_type,
  vm.engine_name,
  vm.engine_displacement_l,
  vm.cylinders,
  vm.power_kw,
  vm.torque_nm,
  vm.drive_type,
  vm.length_mm,
  vm.width_mm,
  vm.height_mm,
  vm.wheelbase_mm,
  vm.fuel_economy_l_100km,
  vm.battery_capacity_kwh,
  vm.usable_battery_kwh,
  vm.ev_range_km,
  vm.ac_charging_kw,
  vm.dc_charging_kw,
  COALESCE(vm.usd_daily_rate_from, vc.usd_daily_rate_from) AS usd_daily_rate_from,
  COALESCE(vm.usd_daily_rate_to, vc.usd_daily_rate_to) AS usd_daily_rate_to
FROM public.vehicle_models AS vm
INNER JOIN public.vehicle_classes AS vc
  ON vc.id = vm.vehicle_class_id
WHERE vm.published = true
  AND vc.active = true;
--> statement-breakpoint

COMMENT ON VIEW public.public_vehicle_catalogue IS
  'Published models in active classes only. Excludes physical vehicle internals, import provenance, and custom fields. Not granted to anon.';
--> statement-breakpoint

REVOKE ALL ON public.public_vehicle_catalogue FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON public.public_vehicle_catalogue TO service_role;
--> statement-breakpoint
GRANT SELECT ON public.public_vehicle_catalogue TO authenticated;
