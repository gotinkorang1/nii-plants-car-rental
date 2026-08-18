"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { slugify } from "@/lib/fleet/slug";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ModelValues = {
  vehicleClassId: string;
  make: string;
  model: string;
  slug: string;
  yearFrom: number | null;
  yearTo: number | null;
  description: string;
  seats: number;
  doors: number;
  transmission: "automatic" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  luggage: number;
  airConditioning: boolean;
  featured: boolean;
  published: boolean;
};

export function VehicleModelForm({
  action,
  classes,
  defaults,
  contentOnly = false,
  lockedSlug = false,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  classes: { id: string; name: string }[];
  defaults?: ModelValues;
  contentOnly?: boolean;
  lockedSlug?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [make, setMake] = useState(defaults?.make ?? "");
  const [model, setModel] = useState(defaults?.model ?? "");

  function refreshSlug(nextMake: string, nextModel: string) {
    if (!lockedSlug && !defaults?.published) {
      setSlug(slugify(`${nextMake} ${nextModel}`));
    }
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-5" aria-busy={pending}>
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}

      <Field label="Vehicle class" htmlFor="vehicleClassId">
        <select
          id="vehicleClassId"
          name="vehicleClassId"
          required={!contentOnly}
          disabled={contentOnly}
          className={selectClassName}
          defaultValue={defaults?.vehicleClassId}
        >
          <option value="">Select class</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" htmlFor="make">
          <Input
            id="make"
            name="make"
            required={!contentOnly}
            disabled={contentOnly}
            value={make}
            onChange={(event) => {
              setMake(event.target.value);
              refreshSlug(event.target.value, model);
            }}
          />
        </Field>
        <Field label="Model" htmlFor="model">
          <Input
            id="model"
            name="model"
            required={!contentOnly}
            disabled={contentOnly}
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              refreshSlug(make, event.target.value);
            }}
          />
        </Field>
      </div>
      <Field label="Public slug" htmlFor="slug">
        <Input id="slug" name="slug" value={slug} readOnly={lockedSlug || contentOnly} onChange={(event) => setSlug(event.target.value)} />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" required defaultValue={defaults?.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Seats" htmlFor="seats">
          <Input id="seats" name="seats" type="number" min={1} disabled={contentOnly} defaultValue={defaults?.seats ?? 5} />
        </Field>
        <Field label="Doors" htmlFor="doors">
          <Input id="doors" name="doors" type="number" min={1} disabled={contentOnly} defaultValue={defaults?.doors ?? 4} />
        </Field>
        <Field label="Luggage" htmlFor="luggage">
          <Input id="luggage" name="luggage" type="number" min={0} disabled={contentOnly} defaultValue={defaults?.luggage ?? 2} />
        </Field>
        <Field label="Year from" htmlFor="yearFrom">
          <Input id="yearFrom" name="yearFrom" type="number" disabled={contentOnly} defaultValue={defaults?.yearFrom ?? ""} />
        </Field>
      </div>
      <Field label="Year to" htmlFor="yearTo">
        <Input id="yearTo" name="yearTo" type="number" disabled={contentOnly} defaultValue={defaults?.yearTo ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Transmission" htmlFor="transmission">
          <select id="transmission" name="transmission" disabled={contentOnly} className={selectClassName} defaultValue={defaults?.transmission ?? "automatic"}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </Field>
        <Field label="Fuel type" htmlFor="fuelType">
          <select id="fuelType" name="fuelType" disabled={contentOnly} className={selectClassName} defaultValue={defaults?.fuelType ?? "petrol"}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="airConditioning" defaultChecked={defaults?.airConditioning ?? true} disabled={contentOnly} />
          Air conditioning
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={defaults?.featured ?? false} />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={defaults?.published ?? false} />
          Published
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
