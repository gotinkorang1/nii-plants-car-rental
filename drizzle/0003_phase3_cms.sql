CREATE TABLE "content_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_pages_title_not_blank" CHECK (char_length(btrim("content_pages"."title")) > 0),
	CONSTRAINT "content_pages_slug_not_blank" CHECK (char_length(btrim("content_pages"."slug")) > 0)
);
--> statement-breakpoint
ALTER TABLE "content_pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faqs_question_not_blank" CHECK (char_length(btrim("faqs"."question")) > 0),
	CONSTRAINT "faqs_answer_not_blank" CHECK (char_length(btrim("faqs"."answer")) > 0),
	CONSTRAINT "faqs_category_not_blank" CHECK (char_length(btrim("faqs"."category")) > 0),
	CONSTRAINT "faqs_sort_order_nonnegative" CHECK ("faqs"."sort_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_path_not_blank" CHECK (char_length(btrim("media_assets"."storage_path")) > 0),
	CONSTRAINT "media_assets_alt_text_not_blank" CHECK (char_length(btrim("media_assets"."alt_text")) > 0),
	CONSTRAINT "media_assets_size_positive" CHECK ("media_assets"."size_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "content_pages_slug_uidx" ON "content_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_pages_published_idx" ON "content_pages" USING btree ("published");--> statement-breakpoint
CREATE INDEX "faqs_published_idx" ON "faqs" USING btree ("published");--> statement-breakpoint
CREATE INDEX "faqs_category_sort_idx" ON "faqs" USING btree ("category","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_storage_path_uidx" ON "media_assets" USING btree ("storage_path");

-- Phase 3 RLS: public catalogue still uses server-side queries. Anon must not
-- receive unrestricted SELECT on CMS tables or media metadata.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_pages_set_updated_at ON public.content_pages;
CREATE TRIGGER content_pages_set_updated_at
  BEFORE UPDATE ON public.content_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS faqs_set_updated_at ON public.faqs;
CREATE TRIGGER faqs_set_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON TABLE public.content_pages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.faqs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.media_assets FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.faqs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_assets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_pages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.faqs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_assets TO service_role;

DROP POLICY IF EXISTS content_pages_staff_all ON public.content_pages;
CREATE POLICY content_pages_staff_all
  ON public.content_pages
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS faqs_staff_all ON public.faqs;
CREATE POLICY faqs_staff_all
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS media_assets_staff_all ON public.media_assets;
CREATE POLICY media_assets_staff_all
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

COMMENT ON TABLE public.content_pages IS
  'Staff CMS pages. Public reads go through the server, not anonymous SELECT.';
COMMENT ON TABLE public.faqs IS
  'Staff-managed FAQs. Unpublished rows must not appear on /help/faqs.';
COMMENT ON TABLE public.media_assets IS
  'Website media library metadata. Files live in the public website-media bucket.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'storage'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'website-media',
      'website-media',
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
        AND policyname = 'website_media_public_read'
    ) THEN
      CREATE POLICY website_media_public_read
        ON storage.objects
        FOR SELECT
        TO anon, authenticated
        USING (bucket_id = 'website-media');
    END IF;
  END IF;
END
$$;