-- CMS stories: news, blog, video, and gallery albums on content_pages.
-- Public reads still go through the app server, not anonymous SELECT.

DO $$ BEGIN
  CREATE TYPE "public"."content_kind" AS ENUM('page', 'news', 'blog', 'video', 'gallery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS kind public.content_kind DEFAULT 'page' NOT NULL;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS cover_media_id uuid;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS video_url text;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE public.content_pages
  DROP CONSTRAINT IF EXISTS content_pages_sort_order_nonnegative;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD CONSTRAINT content_pages_sort_order_nonnegative
  CHECK (sort_order >= 0);
--> statement-breakpoint

ALTER TABLE public.content_pages
  DROP CONSTRAINT IF EXISTS content_pages_cover_media_id_media_assets_id_fk;
--> statement-breakpoint

ALTER TABLE public.content_pages
  ADD CONSTRAINT content_pages_cover_media_id_media_assets_id_fk
  FOREIGN KEY (cover_media_id)
  REFERENCES public.media_assets(id)
  ON DELETE SET NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS content_pages_kind_published_idx
  ON public.content_pages USING btree (kind, published);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS public.content_page_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  caption text,
  sort_order integer DEFAULT 0 NOT NULL,
  CONSTRAINT content_page_media_sort_order_nonnegative CHECK (sort_order >= 0)
);
--> statement-breakpoint

ALTER TABLE public.content_page_media ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS content_page_media_page_media_uidx
  ON public.content_page_media USING btree (page_id, media_id);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS content_page_media_page_sort_idx
  ON public.content_page_media USING btree (page_id, sort_order);
--> statement-breakpoint

REVOKE ALL ON TABLE public.content_page_media FROM PUBLIC, anon, authenticated;
--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_page_media TO authenticated;
--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.content_page_media TO service_role;
--> statement-breakpoint

DROP POLICY IF EXISTS content_page_media_staff_all ON public.content_page_media;
--> statement-breakpoint

CREATE POLICY content_page_media_staff_all
  ON public.content_page_media
  FOR ALL
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());
--> statement-breakpoint

COMMENT ON COLUMN public.content_pages.kind IS
  'page lives at /{slug}. news, blog and video live at /news/{slug}. gallery albums appear on /gallery.';
--> statement-breakpoint

COMMENT ON TABLE public.content_page_media IS
  'Ordered photos attached to a CMS page or gallery album. Files stay in website-media.';
