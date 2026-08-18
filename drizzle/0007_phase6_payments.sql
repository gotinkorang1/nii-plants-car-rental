CREATE TYPE "public"."payment_purpose" AS ENUM('reservation', 'full_rental', 'balance', 'security_deposit', 'additional_charge');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'provider_pending', 'succeeded', 'failed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"purpose" "payment_purpose" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"provider" text NOT NULL,
	"provider_reference" text NOT NULL,
	"provider_transaction_id" text,
	"status" "payment_status" NOT NULL,
	"authorization_url" text,
	"access_code" text,
	"paid_at" timestamp with time zone,
	"provider_snapshot" jsonb,
	"failure_reason" text,
	"review_required" boolean DEFAULT false NOT NULL,
	"review_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0),
	CONSTRAINT "payments_currency_ghs" CHECK ("payments"."currency" = 'GHS'),
	CONSTRAINT "payments_provider_paystack" CHECK ("payments"."provider" = 'paystack'),
	CONSTRAINT "payments_provider_reference_not_blank" CHECK (char_length(btrim("payments"."provider_reference")) > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_uidx" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_purpose_idx" ON "payments" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "payments_review_required_idx" ON "payments" USING btree ("review_required");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_active_initial_uidx" ON "payments" ("booking_id")
  WHERE purpose IN ('reservation', 'full_rental')
    AND status IN ('created', 'provider_pending', 'succeeded');--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_active_balance_uidx" ON "payments" ("booking_id")
  WHERE purpose = 'balance'
    AND status IN ('created', 'provider_pending');--> statement-breakpoint

COMMENT ON TABLE public.payments IS
  'Paystack payment attempts. Browser redirects are not proof of success. Only verified provider state may mark succeeded.';--> statement-breakpoint
COMMENT ON COLUMN public.payments.amount IS
  'Integer pesewas. Copied from the booking snapshot, never from the browser.';--> statement-breakpoint
COMMENT ON COLUMN public.payments.provider_transaction_id IS
  'Paystack transaction id stored as text. Unsigned 64-bit values must not use JS number.';--> statement-breakpoint

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;--> statement-breakpoint
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();--> statement-breakpoint

REVOKE ALL ON TABLE public.payments FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT ON TABLE public.payments TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO service_role;--> statement-breakpoint

DROP POLICY IF EXISTS payments_staff_select ON public.payments;--> statement-breakpoint
CREATE POLICY payments_staff_select
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.is_active_staff());
