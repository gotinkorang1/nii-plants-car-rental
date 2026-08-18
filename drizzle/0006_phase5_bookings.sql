CREATE TYPE "public"."booking_status" AS ENUM('draft', 'held', 'payment_pending', 'confirmed', 'ready', 'checked_out', 'completed', 'cancelled', 'expired', 'under_review', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."booking_history_actor_type" AS ENUM('system', 'customer', 'staff', 'payment');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"status" "booking_status" NOT NULL,
	"customer_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"vehicle_model_id" uuid NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"vehicle_allocation_id" uuid,
	"pickup_location_id" uuid NOT NULL,
	"return_location_id" uuid NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"return_at" timestamp with time zone NOT NULL,
	"rental_total" integer NOT NULL,
	"reservation_payment_required" integer NOT NULL,
	"remaining_balance" integer NOT NULL,
	"security_deposit_required" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"driver_age" integer NOT NULL,
	"licence_country" text NOT NULL,
	"licence_number" text,
	"customer_notes" text,
	"internal_notes" text,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_rental_total_nonnegative" CHECK ("bookings"."rental_total" >= 0),
	CONSTRAINT "bookings_reservation_payment_nonnegative" CHECK ("bookings"."reservation_payment_required" >= 0),
	CONSTRAINT "bookings_remaining_balance_nonnegative" CHECK ("bookings"."remaining_balance" >= 0),
	CONSTRAINT "bookings_security_deposit_nonnegative" CHECK ("bookings"."security_deposit_required" >= 0),
	CONSTRAINT "bookings_amount_paid_nonnegative" CHECK ("bookings"."amount_paid" >= 0),
	CONSTRAINT "bookings_driver_age_range" CHECK ("bookings"."driver_age" >= 25 AND "bookings"."driver_age" <= 99),
	CONSTRAINT "bookings_licence_country_not_blank" CHECK (char_length(btrim("bookings"."licence_country")) > 0),
	CONSTRAINT "bookings_pickup_before_return" CHECK ("bookings"."pickup_at" < "bookings"."return_at"),
	CONSTRAINT "bookings_reference_not_blank" CHECK (char_length(btrim("bookings"."reference")) > 0)
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"actor_type" "booking_history_actor_type" NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"email_normalized" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_access_codes_attempts_nonnegative" CHECK ("booking_access_codes"."attempt_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "booking_access_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_guest_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_class_id_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."vehicle_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_allocation_id_vehicle_allocations_id_fk" FOREIGN KEY ("vehicle_allocation_id") REFERENCES "public"."vehicle_allocations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_return_location_id_locations_id_fk" FOREIGN KEY ("return_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_access_codes" ADD CONSTRAINT "booking_access_codes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_guest_sessions" ADD CONSTRAINT "booking_guest_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_uidx" ON "bookings" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_quote_id_uidx" ON "bookings" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_pickup_at_idx" ON "bookings" USING btree ("pickup_at");--> statement-breakpoint
CREATE INDEX "bookings_allocation_idx" ON "bookings" USING btree ("vehicle_allocation_id");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_idx" ON "booking_status_history" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_status_history_created_at_idx" ON "booking_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "booking_access_codes_booking_idx" ON "booking_access_codes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_access_codes_expires_at_idx" ON "booking_access_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "booking_guest_sessions_booking_idx" ON "booking_guest_sessions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_guest_sessions_expires_at_idx" ON "booking_guest_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_guest_sessions_token_hash_uidx" ON "booking_guest_sessions" USING btree ("token_hash");--> statement-breakpoint

COMMENT ON TABLE public.bookings IS
  'Self-drive bookings. Creating a row does not confirm the reservation. Phase 5 public flow stays payment_pending until Phase 6 verifies payment.';--> statement-breakpoint
COMMENT ON COLUMN public.bookings.rental_total IS
  'Integer pesewas copied from the immutable quote. Do not recalculate at booking creation.';--> statement-breakpoint
COMMENT ON COLUMN public.bookings.amount_paid IS
  'Integer pesewas. Remains 0 until Phase 6 records a verified payment.';--> statement-breakpoint
COMMENT ON COLUMN public.bookings.reference IS
  'Customer-facing identifier. Not authentication.';--> statement-breakpoint

ALTER TABLE public.vehicle_allocations
  ADD CONSTRAINT vehicle_allocations_booking_id_bookings_id_fk
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE restrict;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vehicle_allocations_booking_idx
  ON public.vehicle_allocations (booking_id);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_uidx
  ON public.customers (lower(btrim(email)));--> statement-breakpoint

DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;--> statement-breakpoint
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

REVOKE ALL ON TABLE public.bookings FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.booking_status_history FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.booking_access_codes FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.booking_guest_sessions FROM PUBLIC, anon, authenticated;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE ON TABLE public.bookings TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE public.booking_status_history TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bookings TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.booking_status_history TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.booking_access_codes TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.booking_guest_sessions TO service_role;--> statement-breakpoint

DROP POLICY IF EXISTS bookings_staff_all ON public.bookings;--> statement-breakpoint
CREATE POLICY bookings_staff_all
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());--> statement-breakpoint

DROP POLICY IF EXISTS booking_status_history_staff_select ON public.booking_status_history;--> statement-breakpoint
CREATE POLICY booking_status_history_staff_select
  ON public.booking_status_history
  FOR SELECT
  TO authenticated
  USING (public.is_active_staff());--> statement-breakpoint

DROP POLICY IF EXISTS booking_status_history_staff_insert ON public.booking_status_history;--> statement-breakpoint
CREATE POLICY booking_status_history_staff_insert
  ON public.booking_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_staff());--> statement-breakpoint
