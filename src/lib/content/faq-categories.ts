import { slugify } from "@/lib/fleet/slug";

export const FAQ_CATEGORIES = [
  "Booking",
  "Payments",
  "Vehicle pickup",
  "Vehicle return",
  "Cancellations",
  "Requirements",
  "Support",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export function faqCategoryId(category: string) {
  return `faq-${slugify(category)}`;
}
