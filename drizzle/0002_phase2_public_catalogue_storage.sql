-- Phase 2: safe public catalogue view and public fleet-media bucket.
-- Public catalogue reads go through the server (DATABASE_URL). Do not grant
-- anonymous SELECT on physical vehicles or other internal fleet columns.

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
  vc.default_daily_rate AS daily_rate_pesewas
FROM public.vehicle_models AS vm
INNER JOIN public.vehicle_classes AS vc
  ON vc.id = vm.vehicle_class_id
WHERE vm.published = true
  AND vc.active = true;

COMMENT ON VIEW public.public_vehicle_catalogue IS
  'Published models in active classes only. Excludes physical vehicle internals. Not granted to anon.';

REVOKE ALL ON public.public_vehicle_catalogue FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_vehicle_catalogue TO service_role;
GRANT SELECT ON public.public_vehicle_catalogue TO authenticated;

-- Keep base table grants unchanged: anon still has no SELECT on vehicles.
REVOKE ALL ON TABLE public.vehicles FROM PUBLIC, anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'fleet-media',
      'fleet-media',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
    )
    ON CONFLICT (id) DO UPDATE
      SET
        public = true,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'fleet_media_public_read'
    ) THEN
      CREATE POLICY fleet_media_public_read
        ON storage.objects
        FOR SELECT
        TO anon, authenticated
        USING (bucket_id = 'fleet-media');
    END IF;
  END IF;
END
$$;
