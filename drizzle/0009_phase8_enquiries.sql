CREATE TYPE "public"."enquiry_service_type" AS ENUM(
  'chauffeur',
  'airport_transfer',
  'long_term',
  'corporate',
  'events',
  'multi_city',
  'general'
);--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM(
  'new',
  'in_review',
  'contacted',
  'awaiting_customer',
  'quoted',
  'accepted',
  'declined',
  'closed'
);--> statement-breakpoint
CREATE TYPE "public"."enquiry_source" AS ENUM(
  'website',
  'admin',
  'phone',
  'whatsapp',
  'walk_in',
  'other'
);--> statement-breakpoint

CREATE TABLE "enquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reference" text NOT NULL,
  "service_type" "enquiry_service_type" NOT NULL,
  "status" "enquiry_status" NOT NULL DEFAULT 'new',
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "company_name" text,
  "pickup_location_text" text,
  "return_location_text" text,
  "pickup_at" timestamp with time zone,
  "return_at" timestamp with time zone,
  "passenger_count" integer,
  "vehicle_class_id" uuid,
  "customer_message" text,
  "service_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "quoted_amount" integer,
  "quote_notes" text,
  "quote_valid_until" timestamp with time zone,
  "assigned_to" uuid,
  "internal_notes" text,
  "source" "enquiry_source" NOT NULL DEFAULT 'website',
  "contacted_at" timestamp with time zone,
  "quoted_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "enquiries_reference_not_blank" CHECK (char_length(btrim("enquiries"."reference")) > 0),
  CONSTRAINT "enquiries_first_name_not_blank" CHECK (char_length(btrim("enquiries"."first_name")) > 0),
  CONSTRAINT "enquiries_last_name_not_blank" CHECK (char_length(btrim("enquiries"."last_name")) > 0),
  CONSTRAINT "enquiries_email_not_blank" CHECK (char_length(btrim("enquiries"."email")) > 0),
  CONSTRAINT "enquiries_phone_not_blank" CHECK (char_length(btrim("enquiries"."phone")) > 0),
  CONSTRAINT "enquiries_passenger_count_positive" CHECK ("enquiries"."passenger_count" IS NULL OR "enquiries"."passenger_count" > 0),
  CONSTRAINT "enquiries_quoted_amount_nonnegative" CHECK ("enquiries"."quoted_amount" IS NULL OR "enquiries"."quoted_amount" >= 0),
  CONSTRAINT "enquiries_pickup_before_return" CHECK (
    "enquiries"."pickup_at" IS NULL
    OR "enquiries"."return_at" IS NULL
    OR "enquiries"."pickup_at" < "enquiries"."return_at"
  )
);--> statement-breakpoint
ALTER TABLE "enquiries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_vehicle_class_id_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."vehicle_classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_staff_profiles_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_reference_uidx" ON "enquiries" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enquiries_service_type_idx" ON "enquiries" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_pickup_at_idx" ON "enquiries" USING btree ("pickup_at");--> statement-breakpoint
CREATE INDEX "enquiries_assigned_to_idx" ON "enquiries" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "enquiries_email_idx" ON "enquiries" USING btree ("email");--> statement-breakpoint

CREATE TABLE "enquiry_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enquiry_id" uuid NOT NULL,
  "from_status" "enquiry_status",
  "to_status" "enquiry_status" NOT NULL,
  "actor_type" "audit_actor_type" NOT NULL,
  "actor_id" uuid,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "enquiry_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enquiry_status_history_enquiry_idx" ON "enquiry_status_history" USING btree ("enquiry_id");--> statement-breakpoint
CREATE INDEX "enquiry_status_history_created_at_idx" ON "enquiry_status_history" USING btree ("created_at");--> statement-breakpoint

DROP TRIGGER IF EXISTS enquiries_set_updated_at ON public.enquiries;--> statement-breakpoint
CREATE TRIGGER enquiries_set_updated_at BEFORE UPDATE ON public.enquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

REVOKE ALL ON TABLE public.enquiries FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE public.enquiry_status_history FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enquiries TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enquiry_status_history TO service_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.enquiries TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE public.enquiry_status_history TO authenticated;--> statement-breakpoint

DROP POLICY IF EXISTS enquiries_staff_all ON public.enquiries;--> statement-breakpoint
CREATE POLICY enquiries_staff_all ON public.enquiries FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());--> statement-breakpoint
DROP POLICY IF EXISTS enquiry_status_history_staff_all ON public.enquiry_status_history;--> statement-breakpoint
CREATE POLICY enquiry_status_history_staff_all ON public.enquiry_status_history FOR ALL TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());
