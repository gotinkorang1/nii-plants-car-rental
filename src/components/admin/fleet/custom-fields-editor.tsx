"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUSTOM_FIELDS_MAX,
  CUSTOM_FIELD_LABEL_MAX,
  CUSTOM_FIELD_VALUE_MAX,
  type VehicleCustomField,
} from "@/lib/validation/vehicle-custom-fields";

/**
 * Editor for the reusable "Custom specifications" rows.
 *
 * Staff never see or edit the stored JSON: the serialized value is written to a
 * hidden input for the surrounding form action.
 */
export function CustomFieldsEditor({
  fields,
  onChange,
  disabled = false,
}: {
  fields: VehicleCustomField[];
  onChange: (fields: VehicleCustomField[]) => void;
  disabled?: boolean;
}) {
  const baseId = useId();

  function update(index: number, patch: Partial<VehicleCustomField>) {
    onChange(
      fields.map((field, position) =>
        position === index ? { ...field, ...patch } : field,
      ),
    );
  }

  function remove(index: number) {
    onChange(fields.filter((_, position) => position !== index));
  }

  function add() {
    onChange([...fields, { label: "", value: "", showPublicly: false }]);
  }

  return (
    <section className="space-y-3" aria-labelledby={`${baseId}-heading`}>
      <div>
        <h2 id={`${baseId}-heading`} className="text-lg font-medium">
          Custom specifications
        </h2>
        <p className="text-sm text-muted-foreground">
          Extra details such as ground clearance or luggage capacity. Only rows
          marked public appear on the vehicle page; everything else stays
          internal.
        </p>
      </div>

      <input
        type="hidden"
        name="customFields"
        value={JSON.stringify(fields)}
        readOnly
      />

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom specifications yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const labelId = `${baseId}-label-${index}`;
            const valueId = `${baseId}-value-${index}`;

            return (
              <li
                key={index}
                className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-border sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <Label htmlFor={labelId}>Label</Label>
                  <Input
                    id={labelId}
                    value={field.label}
                    disabled={disabled}
                    maxLength={CUSTOM_FIELD_LABEL_MAX}
                    placeholder="Ground clearance"
                    onChange={(event) =>
                      update(index, { label: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={valueId}>Value</Label>
                  <Input
                    id={valueId}
                    value={field.value}
                    disabled={disabled}
                    maxLength={CUSTOM_FIELD_VALUE_MAX}
                    placeholder="170 mm"
                    onChange={(event) =>
                      update(index, { value: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 sm:pb-1.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.showPublicly}
                      disabled={disabled}
                      onChange={(event) =>
                        update(index, { showPublicly: event.target.checked })
                      }
                    />
                    Public
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    Remove
                    <span className="sr-only">
                      {` custom specification ${field.label || index + 1}`}
                    </span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || fields.length >= CUSTOM_FIELDS_MAX}
        onClick={add}
      >
        Add field
      </Button>
      {fields.length >= CUSTOM_FIELDS_MAX ? (
        <p className="text-sm text-muted-foreground">
          {`You can add up to ${CUSTOM_FIELDS_MAX} custom specifications.`}
        </p>
      ) : null}
    </section>
  );
}
