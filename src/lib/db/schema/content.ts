import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const contentPages = pgTable(
  "content_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("content_pages_slug_uidx").on(table.slug),
    index("content_pages_published_idx").on(table.published),
    check(
      "content_pages_title_not_blank",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      "content_pages_slug_not_blank",
      sql`char_length(btrim(${table.slug})) > 0`,
    ),
  ],
).enableRLS();

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    index("faqs_published_idx").on(table.published),
    index("faqs_category_sort_idx").on(table.category, table.sortOrder),
    check(
      "faqs_question_not_blank",
      sql`char_length(btrim(${table.question})) > 0`,
    ),
    check(
      "faqs_answer_not_blank",
      sql`char_length(btrim(${table.answer})) > 0`,
    ),
    check(
      "faqs_category_not_blank",
      sql`char_length(btrim(${table.category})) > 0`,
    ),
    check("faqs_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
).enableRLS();

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("media_assets_storage_path_uidx").on(table.storagePath),
    check(
      "media_assets_storage_path_not_blank",
      sql`char_length(btrim(${table.storagePath})) > 0`,
    ),
    check(
      "media_assets_alt_text_not_blank",
      sql`char_length(btrim(${table.altText})) > 0`,
    ),
    check("media_assets_size_positive", sql`${table.sizeBytes} > 0`),
  ],
).enableRLS();
