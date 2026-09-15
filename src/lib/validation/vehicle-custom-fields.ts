import { z } from "zod";

export const CUSTOM_FIELD_LABEL_MAX = 60;
export const CUSTOM_FIELD_VALUE_MAX = 200;
export const CUSTOM_FIELDS_MAX = 30;

/**
 * Reusable "Custom specifications" rows on a vehicle model.
 *
 * Order is meaningful and preserved as entered. `showPublicly` opts a row into
 * the public vehicle detail page; everything else stays admin-only.
 */
export const vehicleCustomFieldSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Every custom specification needs a label.")
    .max(
      CUSTOM_FIELD_LABEL_MAX,
      `Custom specification labels must be ${CUSTOM_FIELD_LABEL_MAX} characters or fewer.`,
    ),
  value: z
    .string()
    .trim()
    .min(1, "Every custom specification needs a value.")
    .max(
      CUSTOM_FIELD_VALUE_MAX,
      `Custom specification values must be ${CUSTOM_FIELD_VALUE_MAX} characters or fewer.`,
    ),
  showPublicly: z.boolean().default(false),
});

export const vehicleCustomFieldsSchema = z
  .array(vehicleCustomFieldSchema)
  .max(
    CUSTOM_FIELDS_MAX,
    `Add at most ${CUSTOM_FIELDS_MAX} custom specifications.`,
  )
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    fields.forEach((field, index) => {
      const key = field.label.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "label"],
          message: `"${field.label}" is used more than once. Custom specification labels must be unique.`,
        });
      }
      seen.add(key);
    });
  });

export type VehicleCustomField = z.output<typeof vehicleCustomFieldSchema>;

/**
 * Parses the serialized editor payload. Staff never edit this JSON directly;
 * it is written by the custom specifications editor.
 */
export const vehicleCustomFieldsJsonSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx): unknown => {
    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "The custom specifications could not be read.",
      });
      return z.NEVER;
    }
  })
  .pipe(vehicleCustomFieldsSchema);

/** Rows safe to render on the public vehicle detail page. */
export function publicCustomFields(
  fields: readonly VehicleCustomField[] | null | undefined,
): VehicleCustomField[] {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields.filter((field) => field.showPublicly === true);
}
