-- Phase 11: CarDatabase-assisted vehicle catalogue import.
--
-- Catalogue-only change. Bookings, availability, pricing, payments, enquiries
-- and operations tables are untouched.
--
-- Imported specifications get dedicated, unit-suffixed columns so a stored
-- number always has a known unit (kW, Nm, mm, kWh, km, L/100km). Provenance is
-- recorded but the local row stays authoritative: nothing here refreshes from
-- the provider.

ALTER TABLE public.vehicle_models
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS external_vehicle_id text,
  ADD COLUMN IF NOT EXISTS external_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS generation text,
  -- Named trim_level because TRIM is a SQL keyword.
  ADD COLUMN IF NOT EXISTS trim_level text,
  ADD COLUMN IF NOT EXISTS body_type text,
  ADD COLUMN IF NOT EXISTS engine_name text,
  ADD COLUMN IF NOT EXISTS engine_displacement_l double precision,
  ADD COLUMN IF NOT EXISTS cylinders integer,
  ADD COLUMN IF NOT EXISTS power_kw double precision,
  ADD COLUMN IF NOT EXISTS torque_nm integer,
  ADD COLUMN IF NOT EXISTS drive_type text,
  ADD COLUMN IF NOT EXISTS length_mm integer,
  ADD COLUMN IF NOT EXISTS width_mm integer,
  ADD COLUMN IF NOT EXISTS height_mm integer,
  ADD COLUMN IF NOT EXISTS wheelbase_mm integer,
  ADD COLUMN IF NOT EXISTS fuel_economy_l_100km double precision,
  ADD COLUMN IF NOT EXISTS battery_capacity_kwh double precision,
  ADD COLUMN IF NOT EXISTS usable_battery_kwh double precision,
  ADD COLUMN IF NOT EXISTS ev_range_km integer,
  ADD COLUMN IF NOT EXISTS ac_charging_kw double precision,
  ADD COLUMN IF NOT EXISTS dc_charging_kw double precision;
--> statement-breakpoint

COMMENT ON COLUMN public.vehicle_models.external_provider IS
  'Provider key that supplied the imported specifications, e.g. cardatabase. Local data stays authoritative.';
--> statement-breakpoint
COMMENT ON COLUMN public.vehicle_models.external_vehicle_id IS
  'Provider record reference (brand_slug/model_slug). Never used as the local primary key.';
--> statement-breakpoint
COMMENT ON COLUMN public.vehicle_models.custom_fields IS
  'Ordered array of {label, value, showPublicly} objects. Entries with showPublicly=false are admin-only.';
--> statement-breakpoint

ALTER TABLE public.vehicle_models
  DROP CONSTRAINT IF EXISTS vehicle_models_custom_fields_is_array;
--> statement-breakpoint
ALTER TABLE public.vehicle_models
  ADD CONSTRAINT vehicle_models_custom_fields_is_array
  CHECK (jsonb_typeof(custom_fields) = 'array');
--> statement-breakpoint

ALTER TABLE public.vehicle_models
  DROP CONSTRAINT IF EXISTS vehicle_models_external_reference_complete;
--> statement-breakpoint
ALTER TABLE public.vehicle_models
  ADD CONSTRAINT vehicle_models_external_reference_complete
  CHECK (
    (external_provider IS NULL AND external_vehicle_id IS NULL)
    OR (external_provider IS NOT NULL AND external_vehicle_id IS NOT NULL)
  );
--> statement-breakpoint

ALTER TABLE public.vehicle_models
  DROP CONSTRAINT IF EXISTS vehicle_models_imported_specs_nonnegative;
--> statement-breakpoint
ALTER TABLE public.vehicle_models
  ADD CONSTRAINT vehicle_models_imported_specs_nonnegative
  CHECK (
    (engine_displacement_l IS NULL OR engine_displacement_l > 0)
    AND (cylinders IS NULL OR cylinders > 0)
    AND (power_kw IS NULL OR power_kw > 0)
    AND (torque_nm IS NULL OR torque_nm > 0)
    AND (length_mm IS NULL OR length_mm > 0)
    AND (width_mm IS NULL OR width_mm > 0)
    AND (height_mm IS NULL OR height_mm > 0)
    AND (wheelbase_mm IS NULL OR wheelbase_mm > 0)
    AND (fuel_economy_l_100km IS NULL OR fuel_economy_l_100km > 0)
    AND (battery_capacity_kwh IS NULL OR battery_capacity_kwh > 0)
    AND (usable_battery_kwh IS NULL OR usable_battery_kwh > 0)
    AND (ev_range_km IS NULL OR ev_range_km > 0)
    AND (ac_charging_kw IS NULL OR ac_charging_kw > 0)
    AND (dc_charging_kw IS NULL OR dc_charging_kw > 0)
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS vehicle_models_external_idx
  ON public.vehicle_models (external_provider, external_vehicle_id);
--> statement-breakpoint

-- Supports the "a similar vehicle model already exists" check on save.
CREATE INDEX IF NOT EXISTS vehicle_models_make_model_idx
  ON public.vehicle_models (lower(make), lower(model));
--> statement-breakpoint

ALTER TABLE public.vehicle_images
  ADD COLUMN IF NOT EXISTS source_provider text,
  ADD COLUMN IF NOT EXISTS source_url text;
--> statement-breakpoint

COMMENT ON COLUMN public.vehicle_images.source_provider IS
  'Null for Nii Plants uploads; provider key when the file was copied from an external catalogue.';
--> statement-breakpoint
COMMENT ON COLUMN public.vehicle_images.source_url IS
  'Provider URL the stored object was copied from. Public pages always serve the stored copy.';
--> statement-breakpoint

ALTER TABLE public.vehicle_images
  DROP CONSTRAINT IF EXISTS vehicle_images_source_reference_complete;
--> statement-breakpoint
ALTER TABLE public.vehicle_images
  ADD CONSTRAINT vehicle_images_source_reference_complete
  CHECK (source_url IS NULL OR source_provider IS NOT NULL);
--> statement-breakpoint

-- Extend the public catalogue view with the newly imported public-safe specs.
-- New columns are appended so CREATE OR REPLACE keeps the existing positions.
-- Provenance columns and custom_fields are deliberately excluded: custom fields
-- may hold internal notes, and import provenance is admin-only.
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
  vm.dc_charging_kw
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
