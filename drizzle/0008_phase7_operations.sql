CREATE TYPE "public"."inspection_type" AS ENUM('pickup', 'return');--> statement-breakpoint
CREATE TYPE "public"."fuel_level" AS ENUM('empty', 'quarter', 'half', 'three_quarters', 'full');--> statement-breakpoint
CREATE TYPE "public"."inspection_condition" AS ENUM('good', 'attention_required', 'damage_detected');--> statement-breakpoint
CREATE TYPE "public"."inspection_photo_category" AS ENUM('front', 'rear', 'left', 'right', 'interior', 'dashboard', 'odometer', 'fuel', 'damage', 'other');--> statement-breakpoint
CREATE TYPE "public"."security_deposit_status" AS ENUM('required', 'collected', 'partially_collected', 'held', 'released', 'retained', 'not_required');--> statement-breakpoint
CREATE TYPE "public"."security_deposit_collection_method" AS ENUM('cash', 'mobile_money', 'bank_transfer', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('scheduled_service', 'repair', 'tyre', 'battery', 'bodywork', 'inspection', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint

ALTER TABLE "bookings" ADD COLUMN "ready_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "checked_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint

CREATE TABLE "rental_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"inspection_type" "inspection_type" NOT NULL,
	"odometer" integer,
	"fuel_level" "fuel_level",
	"general_condition" "inspection_condition",
	"damage_summary" text,
	"maintenance_required" boolean DEFAULT false NOT NULL,
	"staff_notes" text,
	"completed_by" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_inspections_odometer_nonnegative" CHECK ("rental_inspections"."odometer" IS NULL OR "rental_inspections"."odometer" >= 0)
);--> statement-breakpoint
ALTER TABLE "rental_inspections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rental_inspections" ADD CONSTRAINT "rental_inspections_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_inspections" ADD CONSTRAINT "rental_inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_inspections" ADD CONSTRAINT "rental_inspections_completed_by_staff_profiles_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rental_inspections_booking_type_uidx" ON "rental_inspections" USING btree ("booking_id", "inspection_type");--> statement-breakpoint
CREATE INDEX "rental_inspections_vehicle_idx" ON "rental_inspections" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "rental_inspections_completed_at_idx" ON "rental_inspections" USING btree ("completed_at");--> statement-breakpoint

CREATE TABLE "inspection_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"category" "inspection_photo_category" NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inspection_photos_storage_path_not_blank" CHECK (char_length(btrim("inspection_photos"."storage_path")) > 0),
	CONSTRAINT "inspection_photos_sort_order_nonnegative" CHECK ("inspection_photos"."sort_order" >= 0)
);--> statement-breakpoint
ALTER TABLE "inspection_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_inspection_id_rental_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."rental_inspections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_uploaded_by_staff_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_photos_inspection_idx" ON "inspection_photos" USING btree ("inspection_id");--> statement-breakpoint

CREATE TABLE "rental_pickup_checklists" (
	"booking_id" uuid PRIMARY KEY NOT NULL,
	"identity_checked" boolean DEFAULT false NOT NULL,
	"licence_checked" boolean DEFAULT false NOT NULL,
	"vehicle_condition_checked" boolean DEFAULT false NOT NULL,
	"fuel_checked" boolean DEFAULT false NOT NULL,
	"odometer_checked" boolean DEFAULT false NOT NULL,
	"customer_briefed" boolean DEFAULT false NOT NULL,
	"security_deposit_recorded" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "rental_pickup_checklists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rental_pickup_checklists" ADD CONSTRAINT "rental_pickup_checklists_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_pickup_checklists" ADD CONSTRAINT "rental_pickup_checklists_updated_by_staff_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "security_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"required_amount" integer NOT NULL,
	"collected_amount" integer DEFAULT 0 NOT NULL,
	"collection_method" "security_deposit_collection_method",
	"status" "security_deposit_status" NOT NULL,
	"collected_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"reference_note" text,
	"staff_notes" text,
	"retention_reason" text,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "security_deposits_required_amount_nonnegative" CHECK ("security_deposits"."required_amount" >= 0),
	CONSTRAINT "security_deposits_collected_amount_nonnegative" CHECK ("security_deposits"."collected_amount" >= 0)
);--> statement-breakpoint
ALTER TABLE "security_deposits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "security_deposits" ADD CONSTRAINT "security_deposits_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_deposits" ADD CONSTRAINT "security_deposits_recorded_by_staff_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "security_deposits_booking_uidx" ON "security_deposits" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "security_deposits_status_idx" ON "security_deposits" USING btree ("status");--> statement-breakpoint

CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"vehicle_allocation_id" uuid,
	"maintenance_type" "maintenance_type" NOT NULL,
	"status" "maintenance_status" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"odometer_at_start" integer,
	"cost" integer,
	"provider_name" text,
	"notes" text,
	"created_by" uuid,
	"completed_by" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_records_title_not_blank" CHECK (char_length(btrim("maintenance_records"."title")) > 0),
	CONSTRAINT "maintenance_records_odometer_nonnegative" CHECK ("maintenance_records"."odometer_at_start" IS NULL OR "maintenance_records"."odometer_at_start" >= 0),
	CONSTRAINT "maintenance_records_cost_nonnegative" CHECK ("maintenance_records"."cost" IS NULL OR "maintenance_records"."cost" >= 0),
	CONSTRAINT "maintenance_records_start_before_end" CHECK ("maintenance_records"."start_at" < "maintenance_records"."end_at")
);--> statement-breakpoint
ALTER TABLE "maintenance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_allocation_id_vehicle_allocations_id_fk" FOREIGN KEY ("vehicle_allocation_id") REFERENCES "public"."vehicle_allocations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_created_by_staff_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_completed_by_staff_profiles_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."staff_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_records_vehicle_idx" ON "maintenance_records" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_records_start_at_idx" ON "maintenance_records" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "maintenance_records_end_at_idx" ON "maintenance_records" USING btree ("end_at");--> statement-breakpoint

DROP TRIGGER IF EXISTS rental_inspections_set_updated_at ON public.rental_inspections;--> statement-breakpoint
CREATE TRIGGER rental_inspections_set_updated_at BEFORE UPDATE ON public.rental_inspections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS rental_pickup_checklists_set_updated_at ON public.rental_pickup_checklists;--> statement-breakpoint
CREATE TRIGGER rental_pickup_checklists_set_updated_at BEFORE UPDATE ON public.rental_pickup_checklists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS security_deposits_set_updated_at ON public.security_deposits;--> statement-breakpoint
CREATE TRIGGER security_deposits_set_updated_at BEFORE UPDATE ON public.security_deposits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS maintenance_records_set_updated_at ON public.maintenance_records;--> statement-breakpoint
CREATE TRIGGER maintenance_records_set_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

REVOKE ALL ON TABLE public.rental_inspections FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.inspection_photos FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.rental_pickup_checklists FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.security_deposits FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.maintenance_records FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rental_inspections TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inspection_photos TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rental_pickup_checklists TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.security_deposits TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.maintenance_records TO service_role;--> statement-breakpoint
GRANT SELECT ON TABLE public.rental_inspections TO authenticated;--> statement-breakpoint
GRANT SELECT ON TABLE public.inspection_photos TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.rental_pickup_checklists TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.security_deposits TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.maintenance_records TO authenticated;--> statement-breakpoint

DROP POLICY IF EXISTS rental_inspections_staff_all ON public.rental_inspections;--> statement-breakpoint
CREATE POLICY rental_inspections_staff_all ON public.rental_inspections FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint
DROP POLICY IF EXISTS inspection_photos_staff_all ON public.inspection_photos;--> statement-breakpoint
CREATE POLICY inspection_photos_staff_all ON public.inspection_photos FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint
DROP POLICY IF EXISTS rental_pickup_checklists_staff_all ON public.rental_pickup_checklists;--> statement-breakpoint
CREATE POLICY rental_pickup_checklists_staff_all ON public.rental_pickup_checklists FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint
DROP POLICY IF EXISTS security_deposits_staff_all ON public.security_deposits;--> statement-breakpoint
CREATE POLICY security_deposits_staff_all ON public.security_deposits FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint
DROP POLICY IF EXISTS maintenance_records_staff_all ON public.maintenance_records;--> statement-breakpoint
CREATE POLICY maintenance_records_staff_all ON public.maintenance_records FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'inspection-media',
      'inspection-media',
      false,
      10485760,
      ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
    )
    ON CONFLICT (id) DO UPDATE
      SET
        public = false,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END
$$;
