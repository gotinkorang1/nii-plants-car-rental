import { z } from "zod";

import { isReservedPublicSlug } from "@/lib/content/reserved-slugs";
import { isValidSlug, requireSlug } from "@/lib/fleet/slug";
import { sanitizeCmsHtml } from "@/lib/content/sanitize-html";
import { FAQ_CATEGORIES } from "@/lib/content/faq-categories";

export { FAQ_CATEGORIES, faqCategoryId } from "@/lib/content/faq-categories";

export const contentPageInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value ?? ""),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().trim().min(1, "Page body is required.").max(20000),
  seoTitle: z
    .string()
    .trim()
    .max(70)
    .optional()
    .transform((value) => value || null),
  seoDescription: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => value || null),
  published: z.boolean().default(false),
});

export const contentPageSchema = contentPageInputSchema
  .superRefine((value, ctx) => {
    let slug = "";
    try {
      slug = requireSlug(value.slug, value.title);
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "A URL slug is required.",
      });
      return;
    }

    if (!isValidSlug(slug) || isReservedPublicSlug(slug)) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Choose a public slug that is not reserved by the application.",
      });
    }
  })
  .transform((value) => {
    const slug = requireSlug(value.slug, value.title);
    return {
      title: value.title,
      slug,
      excerpt: value.excerpt,
      body: sanitizeCmsHtml(value.body),
      seoTitle: value.seoTitle,
      seoDescription: value.seoDescription,
      published: value.published,
    };
  })
  .refine((value) => value.body.trim().length > 0, {
    path: ["body"],
    message: "Page body is required.",
  });

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Question is required.").max(200),
  answer: z.string().trim().min(1, "Answer is required.").max(4000),
  category: z.enum(FAQ_CATEGORIES),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  published: z.boolean().default(false),
});

export const mediaAssetMetadataSchema = z.object({
  altText: z.string().trim().min(1, "Alt text is required.").max(160),
});

export type ContentPageValues = z.output<typeof contentPageSchema>;
export type FaqValues = z.output<typeof faqSchema>;
