CREATE TYPE "public"."allocation_status" AS ENUM('hold', 'confirmed', 'ready', 'checked_out', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."allocation_type" AS ENUM('booking', 'maintenance', 'manual_block');--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_model_id" uuid NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"pickup_location_id" uuid NOT NULL,
	"return_location_id" uuid NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"return_at" timestamp with time zone NOT NULL,
	"chargeable_days" integer NOT NULL,
	"daily_rate" integer NOT NULL,
	"base_rental" integer NOT NULL,
	"extras_total" integer NOT NULL,
	"discount_total" integer NOT NULL,
	"rental_total" integer NOT NULL,
	"reservation_payment" integer NOT NULL,
	"remaining_balance" integer NOT NULL,
	"security_deposit_required" integer NOT NULL,
	"promotion_id" uuid,
	"pricing_snapshot" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_chargeable_days_positive" CHECK ("quotes"."chargeable_days" > 0),
	CONSTRAINT "quotes_daily_rate_nonnegative" CHECK ("quotes"."daily_rate" >= 0),
	CONSTRAINT "quotes_base_rental_nonnegative" CHECK ("quotes"."base_rental" >= 0),
	CONSTRAINT "quotes_extras_total_nonnegative" CHECK ("quotes"."extras_total" >= 0),
	CONSTRAINT "quotes_discount_total_nonnegative" CHECK ("quotes"."discount_total" >= 0),
	CONSTRAINT "quotes_rental_total_nonnegative" CHECK ("quotes"."rental_total" >= 0),
	CONSTRAINT "quotes_reservation_payment_nonnegative" CHECK ("quotes"."reservation_payment" >= 0),
	CONSTRAINT "quotes_remaining_balance_nonnegative" CHECK ("quotes"."remaining_balance" >= 0),
	CONSTRAINT "quotes_security_deposit_nonnegative" CHECK ("quotes"."security_deposit_required" >= 0),
	CONSTRAINT "quotes_pickup_before_return" CHECK ("quotes"."pickup_at" < "quotes"."return_at")
);
--> statement-breakpoint
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"booking_id" uuid,
	"quote_id" uuid,
	"allocation_type" "allocation_type" NOT NULL,
	"status" "allocation_status" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_allocations_start_before_end" CHECK ("vehicle_allocations"."start_at" < "vehicle_allocations"."end_at")
);
--> statement-breakpoint
ALTER TABLE "vehicle_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_class_id_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."vehicle_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_return_location_id_locations_id_fk" FOREIGN KEY ("return_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_allocations" ADD CONSTRAINT "vehicle_allocations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_allocations" ADD CONSTRAINT "vehicle_allocations_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_allocations" ADD CONSTRAINT "vehicle_allocations_created_by_staff_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_model_idx" ON "quotes" USING btree ("vehicle_model_id");--> statement-breakpoint
CREATE INDEX "quotes_class_idx" ON "quotes" USING btree ("vehicle_class_id");--> statement-breakpoint
CREATE INDEX "quotes_expires_at_idx" ON "quotes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "quotes_pickup_at_idx" ON "quotes" USING btree ("pickup_at");--> statement-breakpoint
CREATE INDEX "vehicle_allocations_vehicle_idx" ON "vehicle_allocations" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_allocations_quote_idx" ON "vehicle_allocations" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "vehicle_allocations_status_idx" ON "vehicle_allocations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicle_allocations_type_idx" ON "vehicle_allocations" USING btree ("allocation_type");--> statement-breakpoint
CREATE INDEX "vehicle_allocations_range_idx" ON "vehicle_allocations" USING btree ("start_at","end_at");--> statement-breakpoint

-- Phase 4 PostgreSQL occupancy protection. btree_gist is required so uuid
-- equality can participate in a GiST exclusion constraint with tstzrange.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint

COMMENT ON COLUMN public.vehicles.status IS
  'Current operational condition (available, rented, maintenance, inactive). Scheduled occupancy lives in vehicle_allocations. A vehicle can be status=available while future confirmed allocations exist.';--> statement-breakpoint

COMMENT ON TABLE public.quotes IS
  'Immutable self-drive price snapshots. Do not attach booking_id until Phase 5. Changing trip details creates a new quote.';--> statement-breakpoint

COMMENT ON TABLE public.vehicle_allocations IS
  'Scheduled occupancy for a physical vehicle. vehicles.status is operational condition; this table is the source of booking overlap.';--> statement-breakpoint

COMMENT ON COLUMN public.quotes.daily_rate IS
  'Integer pesewas. Snapshot of class default_daily_rate at quote time.';--> statement-breakpoint

COMMENT ON COLUMN public.quotes.rental_total IS
  'Integer pesewas. Does not include the refundable security deposit.';--> statement-breakpoint

COMMENT ON COLUMN public.quotes.reservation_payment IS
  'Integer pesewas. Percentage of rental_total. Not a security deposit.';--> statement-breakpoint

COMMENT ON COLUMN public.quotes.security_deposit_required IS
  'Integer pesewas. Displayed separately. Not included in rental_total.';--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS promotions_code_lower_uidx
  ON public.promotions (lower(btrim(code)));--> statement-breakpoint

CREATE INDEX IF NOT EXISTS vehicles_class_status_idx
  ON public.vehicles (vehicle_class_id, status);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS vehicle_allocations_vehicle_status_range_idx
  ON public.vehicle_allocations (vehicle_id, status, start_at, end_at);--> statement-breakpoint

ALTER TABLE public.vehicle_allocations
  ADD CONSTRAINT vehicle_allocations_no_overlap_excl
  EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('hold', 'confirmed', 'ready', 'checked_out'));--> statement-breakpoint

DROP TRIGGER IF EXISTS vehicle_allocations_set_updated_at ON public.vehicle_allocations;--> statement-breakpoint
CREATE TRIGGER vehicle_allocations_set_updated_at
  BEFORE UPDATE ON public.vehicle_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.create_vehicle_hold(
  p_vehicle_class_id uuid,
  p_vehicle_model_id uuid,
  p_pickup_at timestamp with time zone,
  p_return_at timestamp with time zone,
  p_quote_id uuid,
  p_hold_minutes integer,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(allocation_id uuid, vehicle_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate record;
  hold_expires timestamp with time zone;
BEGIN
  IF p_pickup_at IS NULL OR p_return_at IS NULL OR p_pickup_at >= p_return_at THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE'
      USING ERRCODE = '22023';
  END IF;

  IF p_vehicle_class_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_VEHICLE_CLASS'
      USING ERRCODE = '22023';
  END IF;

  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_QUOTE'
      USING ERRCODE = '22023';
  END IF;

  IF p_hold_minutes IS NULL OR p_hold_minutes < 1 THEN
    RAISE EXCEPTION 'INVALID_HOLD_DURATION'
      USING ERRCODE = '22023';
  END IF;

  -- Expired holds must not keep blocking. now() cannot appear in the
  -- exclusion predicate, so expire them in this transaction first.
  UPDATE public.vehicle_allocations
  SET status = 'expired'
  WHERE status = 'hold'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  hold_expires := now() + make_interval(mins => p_hold_minutes);

  FOR candidate IN
    SELECT v.id
    FROM public.vehicles AS v
    WHERE v.status = 'available'
      AND v.vehicle_class_id = p_vehicle_class_id
    ORDER BY
      CASE
        WHEN p_vehicle_model_id IS NOT NULL AND v.vehicle_model_id = p_vehicle_model_id THEN 0
        ELSE 1
      END,
      v.created_at,
      v.id
    FOR UPDATE OF v SKIP LOCKED
  LOOP
    BEGIN
      INSERT INTO public.vehicle_allocations (
        vehicle_id,
        quote_id,
        allocation_type,
        status,
        start_at,
        end_at,
        expires_at,
        created_by
      )
      VALUES (
        candidate.id,
        p_quote_id,
        'booking',
        'hold',
        p_pickup_at,
        p_return_at,
        hold_expires,
        p_created_by
      )
      RETURNING
        public.vehicle_allocations.id,
        public.vehicle_allocations.vehicle_id
      INTO
        allocation_id,
        vehicle_id;

      RETURN NEXT;
      RETURN;
    EXCEPTION
      WHEN exclusion_violation THEN
        NULL;
    END;
  END LOOP;

  RAISE EXCEPTION 'VEHICLE_UNAVAILABLE'
    USING ERRCODE = 'P0001';
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid, integer, uuid) FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid, integer, uuid) FROM anon;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid, integer, uuid) FROM authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamp with time zone, timestamp with time zone, uuid, integer, uuid) TO service_role;--> statement-breakpoint

REVOKE ALL ON TABLE public.quotes FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.vehicle_allocations FROM PUBLIC, anon, authenticated;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quotes TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_allocations TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quotes TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicle_allocations TO service_role;--> statement-breakpoint

DROP POLICY IF EXISTS quotes_staff_all ON public.quotes;--> statement-breakpoint
CREATE POLICY quotes_staff_all
  ON public.quotes
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());--> statement-breakpoint

DROP POLICY IF EXISTS vehicle_allocations_staff_all ON public.vehicle_allocations;--> statement-breakpoint
CREATE POLICY vehicle_allocations_staff_all
  ON public.vehicle_allocations
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());