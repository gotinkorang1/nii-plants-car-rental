-- Phase 1 PostgreSQL-specific behaviour: auth foreign keys, updated_at
-- triggers, money column comments, and Row Level Security policies.
-- Anonymous browser clients must not receive unrestricted table access.

-- Auth FKs are applied only when the Supabase auth schema exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth'
      AND table_name = 'users'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'staff_profiles_auth_user_id_fkey'
    ) THEN
      ALTER TABLE public.staff_profiles
        ADD CONSTRAINT staff_profiles_auth_user_id_fkey
        FOREIGN KEY (auth_user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'customers_auth_user_id_fkey'
    ) THEN
      ALTER TABLE public.customers
        ADD CONSTRAINT customers_auth_user_id_fkey
        FOREIGN KEY (auth_user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS staff_profiles_set_updated_at ON public.staff_profiles;
CREATE TRIGGER staff_profiles_set_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS customers_set_updated_at ON public.customers;
CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS locations_set_updated_at ON public.locations;
CREATE TRIGGER locations_set_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vehicle_classes_set_updated_at ON public.vehicle_classes;
CREATE TRIGGER vehicle_classes_set_updated_at
  BEFORE UPDATE ON public.vehicle_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vehicle_models_set_updated_at ON public.vehicle_models;
CREATE TRIGGER vehicle_models_set_updated_at
  BEFORE UPDATE ON public.vehicle_models
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS vehicles_set_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS extras_set_updated_at ON public.extras;
CREATE TRIGGER extras_set_updated_at
  BEFORE UPDATE ON public.extras
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS promotions_set_updated_at ON public.promotions;
CREATE TRIGGER promotions_set_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS vehicle_images_one_primary_per_model_uidx
  ON public.vehicle_images (vehicle_model_id)
  WHERE is_primary = true;

COMMENT ON COLUMN public.vehicle_classes.default_daily_rate IS
  'Integer pesewas. Do not persist JavaScript floating-point money.';
COMMENT ON COLUMN public.vehicle_classes.default_security_deposit IS
  'Integer pesewas. Do not persist JavaScript floating-point money.';
COMMENT ON COLUMN public.extras.price IS
  'Integer pesewas. Do not persist JavaScript floating-point money.';
COMMENT ON COLUMN public.promotions.value IS
  'Percentage points (0-100) when type is percentage; integer pesewas when type is fixed.';
COMMENT ON TABLE public.vehicles IS
  'Physical fleet units. Not public unless a later phase intentionally exposes selected fields.';
COMMENT ON TABLE public.staff_profiles IS
  'Staff users linked to Supabase Auth. Required for admin access.';
COMMENT ON TABLE public.site_settings IS
  'Key/JSON application settings. Seed development defaults only.';

CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles
    WHERE auth_user_id = auth.uid()
      AND active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO service_role;

REVOKE ALL ON TABLE public.staff_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.customers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_classes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_models FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.vehicle_images FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.extras FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.promotions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.site_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.staff_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.staff_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.locations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_classes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_models TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.extras TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO service_role;

DROP POLICY IF EXISTS staff_profiles_select_own_or_staff ON public.staff_profiles;
CREATE POLICY staff_profiles_select_own_or_staff
  ON public.staff_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_active_staff());

DROP POLICY IF EXISTS customers_staff_all ON public.customers;
CREATE POLICY customers_staff_all
  ON public.customers
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS locations_staff_all ON public.locations;
CREATE POLICY locations_staff_all
  ON public.locations
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vehicle_classes_staff_all ON public.vehicle_classes;
CREATE POLICY vehicle_classes_staff_all
  ON public.vehicle_classes
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vehicle_models_staff_all ON public.vehicle_models;
CREATE POLICY vehicle_models_staff_all
  ON public.vehicle_models
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vehicles_staff_all ON public.vehicles;
CREATE POLICY vehicles_staff_all
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS vehicle_images_staff_all ON public.vehicle_images;
CREATE POLICY vehicle_images_staff_all
  ON public.vehicle_images
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS extras_staff_all ON public.extras;
CREATE POLICY extras_staff_all
  ON public.extras
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS promotions_staff_all ON public.promotions;
CREATE POLICY promotions_staff_all
  ON public.promotions
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS site_settings_staff_all ON public.site_settings;
CREATE POLICY site_settings_staff_all
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS audit_logs_staff_select ON public.audit_logs;
CREATE POLICY audit_logs_staff_select
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_active_staff());

DROP POLICY IF EXISTS audit_logs_staff_insert ON public.audit_logs;
CREATE POLICY audit_logs_staff_insert
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_staff());
