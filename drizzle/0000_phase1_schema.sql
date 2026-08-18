CREATE TYPE "public"."audit_actor_type" AS ENUM('staff', 'system', 'customer');--> statement-breakpoint
CREATE TYPE "public"."extra_pricing_type" AS ENUM('once', 'per_day');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('branch', 'airport', 'city', 'pickup_point', 'service_area');--> statement-breakpoint
CREATE TYPE "public"."promotion_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('administrator', 'reservations', 'fleet', 'finance', 'content_editor');--> statement-breakpoint
CREATE TYPE "public"."transmission_type" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'rented', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_action_not_blank" CHECK (char_length(btrim("audit_logs"."action")) > 0),
	CONSTRAINT "audit_logs_entity_type_not_blank" CHECK (char_length(btrim("audit_logs"."entity_type")) > 0)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_first_name_not_blank" CHECK (char_length(btrim("customers"."first_name")) > 0),
	CONSTRAINT "customers_last_name_not_blank" CHECK (char_length(btrim("customers"."last_name")) > 0),
	CONSTRAINT "customers_email_not_blank" CHECK (char_length(btrim("customers"."email")) > 0),
	CONSTRAINT "customers_phone_not_blank" CHECK (char_length(btrim("customers"."phone")) > 0)
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"seats" integer NOT NULL,
	"luggage" integer NOT NULL,
	"transmission" "transmission_type" NOT NULL,
	"default_daily_rate" integer NOT NULL,
	"default_security_deposit" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_classes_name_not_blank" CHECK (char_length(btrim("vehicle_classes"."name")) > 0),
	CONSTRAINT "vehicle_classes_slug_not_blank" CHECK (char_length(btrim("vehicle_classes"."slug")) > 0),
	CONSTRAINT "vehicle_classes_seats_positive" CHECK ("vehicle_classes"."seats" > 0),
	CONSTRAINT "vehicle_classes_luggage_nonnegative" CHECK ("vehicle_classes"."luggage" >= 0),
	CONSTRAINT "vehicle_classes_default_daily_rate_nonnegative" CHECK ("vehicle_classes"."default_daily_rate" >= 0),
	CONSTRAINT "vehicle_classes_default_security_deposit_nonnegative" CHECK ("vehicle_classes"."default_security_deposit" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vehicle_classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_model_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_images_storage_path_not_blank" CHECK (char_length(btrim("vehicle_images"."storage_path")) > 0),
	CONSTRAINT "vehicle_images_alt_text_not_blank" CHECK (char_length(btrim("vehicle_images"."alt_text")) > 0),
	CONSTRAINT "vehicle_images_sort_order_nonnegative" CHECK ("vehicle_images"."sort_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vehicle_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"slug" text NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"description" text NOT NULL,
	"seats" integer NOT NULL,
	"doors" integer NOT NULL,
	"transmission" "transmission_type" NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"luggage" integer NOT NULL,
	"air_conditioning" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_models_make_not_blank" CHECK (char_length(btrim("vehicle_models"."make")) > 0),
	CONSTRAINT "vehicle_models_model_not_blank" CHECK (char_length(btrim("vehicle_models"."model")) > 0),
	CONSTRAINT "vehicle_models_slug_not_blank" CHECK (char_length(btrim("vehicle_models"."slug")) > 0),
	CONSTRAINT "vehicle_models_seats_positive" CHECK ("vehicle_models"."seats" > 0),
	CONSTRAINT "vehicle_models_doors_positive" CHECK ("vehicle_models"."doors" > 0),
	CONSTRAINT "vehicle_models_luggage_nonnegative" CHECK ("vehicle_models"."luggage" >= 0),
	CONSTRAINT "vehicle_models_year_range" CHECK ("vehicle_models"."year_from" IS NULL OR "vehicle_models"."year_to" IS NULL OR "vehicle_models"."year_to" >= "vehicle_models"."year_from")
);
--> statement-breakpoint
ALTER TABLE "vehicle_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_model_id" uuid NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"internal_code" text NOT NULL,
	"registration_number" text NOT NULL,
	"colour" text NOT NULL,
	"current_mileage" integer DEFAULT 0 NOT NULL,
	"status" "vehicle_status" DEFAULT 'inactive' NOT NULL,
	"branch_location_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_internal_code_not_blank" CHECK (char_length(btrim("vehicles"."internal_code")) > 0),
	CONSTRAINT "vehicles_registration_number_not_blank" CHECK (char_length(btrim("vehicles"."registration_number")) > 0),
	CONSTRAINT "vehicles_colour_not_blank" CHECK (char_length(btrim("vehicles"."colour")) > 0),
	CONSTRAINT "vehicles_mileage_nonnegative" CHECK ("vehicles"."current_mileage" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "location_type" NOT NULL,
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_name_not_blank" CHECK (char_length(btrim("locations"."name")) > 0),
	CONSTRAINT "locations_slug_not_blank" CHECK (char_length(btrim("locations"."slug")) > 0)
);
--> statement-breakpoint
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"pricing_type" "extra_pricing_type" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extras_name_not_blank" CHECK (char_length(btrim("extras"."name")) > 0),
	CONSTRAINT "extras_price_nonnegative" CHECK ("extras"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "extras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "promotion_type" NOT NULL,
	"value" integer NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"max_uses" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_code_not_blank" CHECK (char_length(btrim("promotions"."code")) > 0),
	CONSTRAINT "promotions_value_nonnegative" CHECK ("promotions"."value" >= 0),
	CONSTRAINT "promotions_percentage_value_range" CHECK ("promotions"."type" <> 'percentage' OR ("promotions"."value" >= 0 AND "promotions"."value" <= 100)),
	CONSTRAINT "promotions_usage_count_nonnegative" CHECK ("promotions"."usage_count" >= 0),
	CONSTRAINT "promotions_max_uses_positive" CHECK ("promotions"."max_uses" IS NULL OR "promotions"."max_uses" > 0),
	CONSTRAINT "promotions_usage_within_max" CHECK ("promotions"."max_uses" IS NULL OR "promotions"."usage_count" <= "promotions"."max_uses"),
	CONSTRAINT "promotions_date_range" CHECK ("promotions"."ends_at" >= "promotions"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "promotions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_not_blank" CHECK (char_length(btrim("site_settings"."key")) > 0)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_profiles_display_name_not_blank" CHECK (char_length(btrim("staff_profiles"."display_name")) > 0),
	CONSTRAINT "staff_profiles_email_not_blank" CHECK (char_length(btrim("staff_profiles"."email")) > 0)
);
--> statement-breakpoint
ALTER TABLE "staff_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_vehicle_class_id_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."vehicle_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_class_id_vehicle_classes_id_fk" FOREIGN KEY ("vehicle_class_id") REFERENCES "public"."vehicle_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branch_location_id_locations_id_fk" FOREIGN KEY ("branch_location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_uidx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_auth_user_id_idx" ON "customers" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_classes_slug_uidx" ON "vehicle_classes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_classes_name_uidx" ON "vehicle_classes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "vehicle_classes_active_idx" ON "vehicle_classes" USING btree ("active");--> statement-breakpoint
CREATE INDEX "vehicle_images_model_idx" ON "vehicle_images" USING btree ("vehicle_model_id");--> statement-breakpoint
CREATE INDEX "vehicle_images_sort_idx" ON "vehicle_images" USING btree ("vehicle_model_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_slug_uidx" ON "vehicle_models" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "vehicle_models_class_idx" ON "vehicle_models" USING btree ("vehicle_class_id");--> statement-breakpoint
CREATE INDEX "vehicle_models_published_idx" ON "vehicle_models" USING btree ("published");--> statement-breakpoint
CREATE INDEX "vehicle_models_featured_idx" ON "vehicle_models" USING btree ("featured");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_internal_code_uidx" ON "vehicles" USING btree ("internal_code");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_registration_number_uidx" ON "vehicles" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicles_model_idx" ON "vehicles" USING btree ("vehicle_model_id");--> statement-breakpoint
CREATE INDEX "vehicles_class_idx" ON "vehicles" USING btree ("vehicle_class_id");--> statement-breakpoint
CREATE INDEX "vehicles_branch_idx" ON "vehicles" USING btree ("branch_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_slug_uidx" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "locations_active_idx" ON "locations" USING btree ("active");--> statement-breakpoint
CREATE INDEX "locations_type_idx" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "extras_name_uidx" ON "extras" USING btree ("name");--> statement-breakpoint
CREATE INDEX "extras_active_idx" ON "extras" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_code_uidx" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promotions_active_idx" ON "promotions" USING btree ("active");--> statement-breakpoint
CREATE INDEX "promotions_schedule_idx" ON "promotions" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_key_uidx" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_auth_user_id_uidx" ON "staff_profiles" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profiles_email_uidx" ON "staff_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "staff_profiles_role_idx" ON "staff_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_profiles_active_idx" ON "staff_profiles" USING btree ("active");